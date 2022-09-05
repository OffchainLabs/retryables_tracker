import { log, reportUnredeemed, wait } from "./lib";
import yargs from "yargs/yargs";
import argv from "../src/getClargs";
// let chainids:Array<number>;
// let rebootMinutes:number;
// let intervalHours:number;
const { chainids, rebootMinutes, intervalHours } = argv;


export const keepReportUnredeemedProcess = async () => {
  while(true){
    await reportUnredeemed(chainids)
    await wait(intervalHours * 60 * 60 * 1000)
  }
}



export const reportUnredeemedProcess = async () => {
  keepReportUnredeemedProcess().catch(async (e: Error) => {
    log(`Error in ${chainids.join(",")} reporting process: ${e.toString()}. restarting in ${rebootMinutes}`,1)
    setTimeout(reportUnredeemedProcess, 1000 * 60 * rebootMinutes);
  });
}


process.on("uncaughtException", async function(e) {
  log(`Uncaught exception in ${chainids.join(",")} reporting process: ${e.toString()}. restarting in ${rebootMinutes}`, 1)

    setTimeout(reportUnredeemedProcess, 1000 * 60 * rebootMinutes);
  });
  
