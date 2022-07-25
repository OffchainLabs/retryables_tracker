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

const syncChain = async (chainID: number, maxBlocks: number) => {
  const chain = await ArbChain.findByPk(chainID);
  console.log(chain);
  if (!chain) throw new Error(`Chain ${chainID} not found`);

  const lastBlockChecked = (await chain.getDataValue(
    "lastBlockChecked"
  )) as number;
  const l1rpcUrl = await chain.getDataValue("l1rpcURL");
  const l2rpcUrl = await chain.getDataValue("l2rpcURL");
  console.log(l1rpcUrl, l2rpcUrl);

  const inboxAddress = await chain.getDataValue("inboxAddress");

  const l1Provider = new providers.JsonRpcProvider(l1rpcUrl);
  const l2Provider = new providers.JsonRpcProvider(l2rpcUrl);

  const currentL1Block = await l1Provider.getBlockNumber();
  const limit = currentL1Block - 4 * 30;
  const toBlock = Math.min(lastBlockChecked + maxBlocks, limit);

  const eventFetcher = new EventFetcher(l1Provider);

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
          arbChain: chain
        });
      }
    }
  }
  await chain.setDataValue("lastBlockChecked", toBlock);
  return {
    finished: toBlock === limit
  };
};

syncChain(42161, 1000);
