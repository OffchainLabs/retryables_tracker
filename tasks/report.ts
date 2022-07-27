import { log, reportUnredeemed, wait } from "./lib";
import yargs from "yargs/yargs";

const { chainids, rebootMinutes, intervalHours } = yargs(process.argv.slice(2))
  .options({
    chainids: {
      type: "array",
      demandOption: true,
      alias: "ids",
      description: "Chain Ids to report on",
      number: true
    },
    rebootMinutes: {
      type: "number",
      default: 60,
      description: "Pause time if error occurs before restarting process"
    },
    intervalHours: { type: "number", default: 12, description: "Frequency (hours) over which to report" }
  })
  .parseSync();


const reportUnredeemedProcess = async () => {
  while(true){
    await reportUnredeemed(chainids)
    await wait(intervalHours * 60 * 60 * 1000)
  }
}


reportUnredeemedProcess().catch(async (e: Error) => {
  log(`Error in ${chainids.join(",")} reporting process: ${e.toString()}. restarting in ${rebootMinutes}`,1)
  setTimeout(reportUnredeemedProcess, 1000 * 60 * rebootMinutes);
});

process.on("uncaughtException", async function(e) {
  log(`Uncaught exception in ${chainids.join(",")} reporting process: ${e.toString()}. restarting in ${rebootMinutes}`, 1)

    setTimeout(reportUnredeemedProcess, 1000 * 60 * rebootMinutes);
  });
  
