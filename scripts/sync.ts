import ArbChain from "../db/models/Arbchain";
import Retryable from "../db/models/Retryable";

import { providers } from "ethers";
import {
  EventFetcher,
  L1TransactionReceipt,
  L1ToL2MessageStatus
} from "@arbitrum/sdk";
import { Inbox__factory } from "@arbitrum/sdk/dist/lib/abi/factories/Inbox__factory";
import {
  InboxMessageDeliveredEvent,
  Inbox
} from "@arbitrum/sdk/dist/lib/abi/Inbox";
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const blocksFromChainTip = 120;

const scanForRetryables = async (
  chainID: number,
  blocksPerInboxQuery: number
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
  console.log("checking", lastBlockChecked, toBlock);

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
        Retryable.create({
          status,
          l1TxHash,
          msgIndex,
          ArbchainId: chainID
        });
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

const syncRetryables = async (chainID: number, blocksPerInboxQuery: number) => {
  while (true) {
    const { finished, toBlock } = await scanForRetryables(
      chainID,
      blocksPerInboxQuery
    );
    if (finished) {
      await wait(blocksFromChainTip * 15 * 100);
    }
  }
};

const updateStatus = async (chainID: number) => {
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
    } else {
    }
  }
};
// sync(42161, 1000);
updateStatus(42161);
