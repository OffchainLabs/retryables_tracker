import { log, reportUnredeemed, wait } from "./lib";
import { Retryable } from "../db/models";
import argv from "../src/getClargs";

const { l1TxHash, msgIndex, chainid: ArbchainId, explanation } = argv;


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

