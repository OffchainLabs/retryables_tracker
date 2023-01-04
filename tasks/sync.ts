import { syncRetryables, log } from "./lib";
import argv from "../src/getClargs";

const { blocksperquery, chainid, blocksFromTip, rebootMinutes, oneOff } = argv

export const syncRetryablesProcess = () => {
  syncRetryables(chainid!, blocksperquery, blocksFromTip).catch(
    async (e: Error) => {
      log(`Error in ${chainid} sync process: ${e.toString()}. restarting in ${rebootMinutes}`,1)

      setTimeout(syncRetryablesProcess, 1000 * 60 * rebootMinutes);
    }
  );
};

export const syncRetryablesOneOff = () => {
  console.log('Starting sync retryables one-off:');
  
  return syncRetryables(chainid!, blocksperquery, blocksFromTip, true).catch(
    async (e: Error) => {
      log(`Error in ${chainid} sync process: ${e.toString()}`,1)
    }
  );
};


!oneOff && process.on("uncaughtException", async function(e) {
  log(`Uncaught exception in ${chainid} sync process: ${e.toString()}. restarting in ${rebootMinutes}`, 1)
  setTimeout(syncRetryablesProcess, 1000 * 60 * rebootMinutes);
});

//syncRetryablesProcess();
