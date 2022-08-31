import { syncRetryables, log } from "./lib";

import yargs from "yargs/yargs";
import exp from "constants";

const { blocksperquery, chainid, blocksFromTip, rebootMinutes } = yargs(
  process.argv.slice(2)
)
  .options({
    blocksperquery: { type: "number", default: 1000, alias: "blocks", description: "Number of blocks in range of each inbox event query" },
    chainid: { type: "number", demandOption: true, alias: "id", description: "Chain to sync" },
    blocksFromTip: { type: "number", default: 120, description: "Distance from tip of L1 chain (in blocks) at which to pause scanning and wait (want to give some buffer for retryables to be included by the sequencer)" },
    rebootMinutes: { type: "number", default: 60,  description: "Pause time if error occurs before restarting process" }
  })
  .parseSync();

export const syncRetryablesProcess = () => {
  syncRetryables(chainid, blocksperquery, blocksFromTip).catch(
    async (e: Error) => {
      log(`Error in ${chainid} sync process: ${e.toString()}. restarting in ${rebootMinutes}`,1)

      setTimeout(syncRetryablesProcess, 1000 * 60 * rebootMinutes);
    }
  );
};

process.on("uncaughtException", async function(e) {
  log(`Uncaught exception in ${chainid} sync process: ${e.toString()}. restarting in ${rebootMinutes}`, 1)
  setTimeout(syncRetryablesProcess, 1000 * 60 * rebootMinutes);
});

//syncRetryablesProcess();
