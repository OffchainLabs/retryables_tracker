import { Arbchain as ArbChain, Retryable } from "../db/models";

import { providers } from "ethers";
import {
  EventFetcher,
  L1TransactionReceipt,
  L1ToL2MessageStatus,
  getL1Network
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
    order: ["l1TimestampCreated"]
  });
  if (unredeemed.length > 0) {
    const { l1TimestampCreated, l1TxHash } = unredeemed[0].toJSON();

    log(
      `Found ${unredeemed.length} unredeemed ticket${
        unredeemed.length > 1 ? "s" : ""
      };${unredeemed.length > 1 ? " eldest" : ""} initiated at ${new Date(
        l1TimestampCreated * 1000
      ).toString()} — https://retryable-tx-panel.arbitrum.io/tx/${l1TxHash}. See https://retryablestatus.arbitrum.io/unredeemed/mainnet for all of them.`,
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
  const { l1rpcURL, l2rpcURL, inboxAddress, id } = chain.toJSON();

  const l1Provider = new providers.JsonRpcProvider(l1rpcURL);
  const l2Provider = new providers.JsonRpcProvider(l2rpcURL);
  const n = await getL1Network(l1Provider);
  if (n.chainID === 1 && !n.partnerChainIDs.includes(42170)) {
    n.partnerChainIDs.push(42170);
  }

  const currentL1Block = await l1Provider.getBlockNumber();
  const limit = currentL1Block - blocksFromChainTip;
  const toBlock = Math.min(lastBlockChecked + blocksPerInboxQuery, limit);

  const eventFetcher = new EventFetcher(l1Provider);
  console.log("checking blocks", lastBlockChecked, toBlock);

  const inboxDeliveredLogs = await eventFetcher.getEvents<
    Inbox,
    InboxMessageDeliveredEvent
  >(
    Inbox__factory,
    // @ts-ignore
    g => g.filters.InboxMessageDelivered(),
    {
      fromBlock: lastBlockChecked + 1,
      toBlock,
      address: inboxAddress
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
  blocksFromChainTip: number,
  oneOff?: boolean
) => {
  while (true) {
    const { finished, toBlock } = await scanForRetryables(
      chainID,
      blocksPerInboxQuery,
      blocksFromChainTip
    );
    if (finished) {
      if (oneOff){
        return 
      } else {
        await wait(blocksFromChainTip * 15 * 1000);
      }
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
      // don't report as expired if msg has been flagged as don't report
      try {
        const msg = await Retryable.findOne({
          where: {
            l1TxHash,
            msgIndex,
            chainID,
            dontReport: true
          }
        });

        if (msg) {
          return;
        }
      } catch (err) {
        console.log(err);
      }

      log(
        `Retryable expired: l1tx: ${l1TxHash} msg Index: ${msgIndex} chain: ${chainID}`,
        2
      );
    }
  }
};
