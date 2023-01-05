import { log, reportUnredeemed, wait } from "./lib";
import argv from "../src/getClargs";

const { chainids, rebootMinutes, intervalHours } = argv;


export const reportUnredeemedOneOff = ()=>{
  reportUnredeemed(chainids).catch(async (e: Error) => {
    log(`Error in ${chainids.join(",")} reporting process: ${e.toString()}`,1)
  });
}

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

