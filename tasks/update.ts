import { updateStatus, wait, log } from "./lib";
import yargs from "yargs/yargs";
import argv from "../src/getClargs";

const { chainid, rebootMinutes, intervalMinutes } = argv

const keepUpdateProcess = async () => {
  while (true) {
    await updateStatus(chainid!);
    await wait(intervalMinutes * 1000 * 60);
  }
};


export const updateProcess = async () => {
  keepUpdateProcess().catch(async (e: Error) => {
    log(`Error in ${chainid} update process: ${e.toString()}. restarting in ${rebootMinutes}`,1)
  
    setTimeout(updateProcess, 1000 * 60 * rebootMinutes);
  });
}

process.on("uncaughtException", async function(e) {
  log(`Uncaught exception in ${chainid} update process: ${e.toString()}. restarting in ${rebootMinutes}`, 1)

    setTimeout(updateProcess, 1000 * 60 * rebootMinutes);
  });
  