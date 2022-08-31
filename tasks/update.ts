import { updateStatus, wait, log } from "./lib";
import yargs from "yargs/yargs";

const { chainid, rebootMinutes, intervalMinutes } = yargs(process.argv.slice(2))
  .options({
    chainid: { type: "number", demandOption: true, alias: "id", description: "Target chain Id" },
    rebootMinutes: {
      type: "number",
      default: 60,
      description: "Pause time if error occurs before restarting process"
    },
    intervalMinutes: { type: "number", default: 3, description: "Frequency at which to check for updated status" },
  })
  .parseSync();

const keepUpdateProcess = async () => {
  while (true) {
    await updateStatus(chainid);
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
  