import { syncRetryables, log } from "./lib";

import yargs from "yargs/yargs";
import exp from "constants";
import argv from "../src/getClargs";

const { blocksperquery, chainid, blocksFromTip, rebootMinutes } = argv

export const syncRetryablesProcess = () => {
  syncRetryables(chainid!, blocksperquery, blocksFromTip).catch(
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
