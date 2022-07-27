import { Arbchain as ArbChain, Retryable } from "../db/models";

import { providers } from "ethers";
import {
  EventFetcher,
  L1TransactionReceipt,
  L1ToL2MessageStatus,
  L2Network,
  addCustomNetwork
} from "@arbitrum/sdk";
import { Inbox__factory } from "@arbitrum/sdk/dist/lib/abi/factories/Inbox__factory";
import {
  InboxMessageDeliveredEvent,
  Inbox
} from "@arbitrum/sdk/dist/lib/abi/Inbox";

import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import { Op } from "sequelize";

dotenv.config();

// temporary: 
export const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60
const nova:L2Network = {
  chainID: 42170,
  confirmPeriodBlocks: 20,
  ethBridge: {
    bridge: "0xc1ebd02f738644983b6c4b2d440b8e77dde276bd",
    inbox: "0xc4448b71118c9071bcb9734a0eac55d18a153949",
    outbox: "0xD4B80C3D7240325D18E645B49e6535A3Bf95cc58",
    rollup: "0xfb209827c58283535b744575e11953dcc4bead88",
    sequencerInbox: "0x211e1c4c7f1bf5351ac850ed10fd68cffcf6c21b"
  },
  explorerUrl: "https://a4ba-explorer.arbitrum.io",
  isArbitrum: true,
  isCustom: true,
  name: "Arbitrum Nova",
  partnerChainID: 1,
  rpcURL: process.env["NOVA_RPC"] as string,
  retryableLifetimeSeconds: SEVEN_DAYS_IN_SECONDS,
  tokenBridge: {
    l1CustomGateway: "0x23122da8C581AA7E0d07A36Ff1f16F799650232f",
    l1ERC20Gateway: "0xB2535b988dcE19f9D71dfB22dB6da744aCac21bf",
    l1GatewayRouter: "0xC840838Bc438d73C16c2f8b22D2Ce3669963cD48",
    l1MultiCall: "0x8896d23afea159a5e9b72c9eb3dc4e2684a38ea3",
    l1ProxyAdmin: "0xa8f7DdEd54a726eB873E98bFF2C95ABF2d03e560",
    l1Weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    l1WethGateway: "0xE4E2121b479017955Be0b175305B35f312330BaE",
    l2CustomGateway: "0xbf544970E6BD77b21C6492C281AB60d0770451F4",
    l2ERC20Gateway: "0xcF9bAb7e53DDe48A6DC4f286CB14e05298799257",
    l2GatewayRouter: "0x21903d3F8176b1a0c17E953Cd896610Be9fFDFa8",
    l2Multicall: "0x5e1eE626420A354BbC9a95FeA1BAd4492e3bcB86",
    l2ProxyAdmin: "0xada790b026097BfB36a5ed696859b97a96CEd92C",
    l2Weth: "0x722E8BdD2ce80A4422E880164f2079488e115365",
    l2WethGateway: "0x7626841cB6113412F9c88D3ADC720C9FAC88D9eD"
  }
};

addCustomNetwork({
  customL2Network: nova
});

const slackToken = process.env.SLACK_TOKEN;
const slackChannel_1 = process.env.SLACK_CHANNEL_1 as string;
const slackChannel_2 = process.env.SLACK_CHANNEL_2 as string;
export const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const web = new WebClient(slackToken);
type LogLevel = 0 | 1 | 2;

export const log = (text: string, logLevel: LogLevel = 0) => {
  console.log();
  console.log(text);
  console.log();

  if (process.env.ENABLE_SLACK !== "true" || logLevel === 0) return;
  return web.chat.postMessage({
    text,
    channel: logLevel === 1 ? slackChannel_1 : slackChannel_2
  });
};

export const reportUnredeemed = async (chaindIDOrIds: number[] | number) => {
  const chainIDs =
    typeof chaindIDOrIds === "number" ? [chaindIDOrIds] : chaindIDOrIds;
  // sanity
  const res = await ArbChain.findAll({
    where: {
      [Op.or]: chainIDs.map(id => ({ id }))
    }
  });
  if (res.length !== chainIDs.length) {
    throw new Error("Unrecognized chain id");
  }

  const unredeemed = await Retryable.findAll({
    where: {
      [Op.or]: chainIDs.map(ArbchainId => ({ ArbchainId })),
      status: L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2,
      dontReport: false
    },
    order: ["l1TimestampCreated"],
  });
  if (unredeemed.length > 0) {
    // TODO
    const { l1TimestampCreated } = unredeemed[0].toJSON();

    log(
      `Found ${unredeemed.length} unredeemed ticket${
        unredeemed.length > 1 ? "s" : ""
      };${unredeemed.length > 1 ? " eldest" : ""} initiated at ${new Date(
        l1TimestampCreated
      ).toString()}`,
      2
    );
  } else {
    log("Nothing to redeem");
  }
};

const scanForRetryables = async (
  chainID: number,
  blocksPerInboxQuery: number,
  blocksFromChainTip: number
) => {
  const chain = await ArbChain.findByPk(chainID);
  if (!chain) throw new Error(`Chain ${chainID} not found`);
  const lastBlockChecked = (await chain.getDataValue(
    "lastBlockChecked"
  )) as number;
  const { l1rpcURL, l2rpcURL, inboxAddress } = chain.toJSON();

  const l1Provider = new providers.JsonRpcProvider(l1rpcURL);
  const l2Provider = new providers.JsonRpcProvider(l2rpcURL);

  const currentL1Block = await l1Provider.getBlockNumber();
  const limit = currentL1Block - blocksFromChainTip;
  const toBlock = Math.min(lastBlockChecked + blocksPerInboxQuery, limit);

  const eventFetcher = new EventFetcher(l1Provider);
  console.log("checking blocks", lastBlockChecked, toBlock);

  const inboxDeliveredLogs = await eventFetcher.getEvents<
    Inbox,
    InboxMessageDeliveredEvent
  >(
    inboxAddress,
    Inbox__factory,
    // @ts-ignore
    g => g.filters.InboxMessageDelivered(),
    {
      fromBlock: lastBlockChecked + 1,
      toBlock
    }
  );

  for (let inboxDeliveredLog of inboxDeliveredLogs) {
    if (inboxDeliveredLog.data.length === 706) continue; // depositETH bypass
    const { transactionHash: l1TxHash } = inboxDeliveredLog;
    const rec = new L1TransactionReceipt(
      await l1Provider.getTransactionReceipt(l1TxHash)
    );
    const messages = await rec.getL1ToL2Messages(l2Provider);
    for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
      const message = messages[msgIndex];
      let status = await message.status();
      if (status !== L1ToL2MessageStatus.REDEEMED) {
        const { timestamp } = await l1Provider.getBlock(rec.blockNumber);
        Retryable.create({
          status,
          l1TxHash,
          msgIndex,
          ArbchainId: chainID,
          l1TimestampCreated: timestamp
        });

        // live report expiration or failure
        if (status === L1ToL2MessageStatus.EXPIRED) {
          log(
            `Retryable expired: l1tx: ${l1TxHash} msg Index: ${msgIndex} chain: ${chainID}`,
            2
          );
        } else if (status === L1ToL2MessageStatus.CREATION_FAILED) {
          log(
            `Severe error — ticket creation failed: l1tx: ${l1TxHash} msg Index: ${msgIndex} chain: ${chainID}`,
            2
          );
        }
      }
    }
    await chain.update({
      lastBlockChecked: rec.blockNumber - 1
    });
  }
  console.warn("done", toBlock);

  await chain.update({
    lastBlockChecked: toBlock
  });

  return {
    finished: toBlock === limit,
    toBlock
  };
};

export const syncRetryables = async (
  chainID: number,
  blocksPerInboxQuery: number,
  blocksFromChainTip: number
) => {
  while (true) {
    const { finished, toBlock } = await scanForRetryables(
      chainID,
      blocksPerInboxQuery,
      blocksFromChainTip
    );
    if (finished) {
      await wait(blocksFromChainTip * 15 * 1000);
    }
  }
};

export const updateStatus = async (chainID: number) => {
  const chain = await ArbChain.findByPk(chainID);
  if (!chain) throw new Error(`Chain ${chainID} not found`);
  const { l1rpcURL, l2rpcURL } = chain.toJSON();

  const l1Provider = new providers.JsonRpcProvider(l1rpcURL);
  const l2Provider = new providers.JsonRpcProvider(l2rpcURL);

  const res = await Retryable.findAll({
    where: {
      ArbchainId: chainID,
      status: L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2
    }
  });

  for (let message of res) {
    const { l1TxHash, msgIndex } = message.toJSON();
    const rec = new L1TransactionReceipt(
      await l1Provider.getTransactionReceipt(l1TxHash)
    );
    const l1ToL2Message = (await rec.getL1ToL2Messages(l2Provider))[msgIndex];
    if (!l1ToL2Message) throw new Error("Msg not found");
    const status = await l1ToL2Message.status();
    if (status !== L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2) {
      console.log("status updated for", message);
      await message.update({
        status
      });
    }
    // Live message if message expires
    if (status === L1ToL2MessageStatus.EXPIRED) {
      log(
        `Retryable expired: l1tx: ${l1TxHash} msg Index: ${msgIndex} chain: ${chainID}`,
        2
      );
    }
  }
};
