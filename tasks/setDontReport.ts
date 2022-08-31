import { log, reportUnredeemed, wait } from "./lib";
import yargs from "yargs/yargs";
import { Retryable } from "../db/models";

const { l1TxHash, msgIndex, chainid: ArbchainId, explanation } = yargs(
  process.argv.slice(2)
)
  .options({
    l1TxHash: {
      type: "string",
      demandOption: true,
      description: "Target Tx Hash"
    },
    msgIndex: {
      type: "number",
      demandOption: true,
      description: "Target Tx msg number"
    },
    chainid: {
      type: "number",
      demandOption: true,
      description: "Target arb chainId"
    },
    explanation: {
      type: "string",
      demandOption: true,
      description: ""
    }
  })
  .parseSync();


export const sentDontReportProgress = async () => {
  const msg = await Retryable.findOne({
    where: {
      l1TxHash,
      msgIndex,
      ArbchainId
    }
  });

  if (!msg) throw new Error("Msg not found");
  await msg.update({
    dontReport: true
  });
  log(
    `Will not report about msg with l1TxnHash ${l1TxHash} (index ${msgIndex}). Reason:'${explanation}'`,
    2
  );
}

