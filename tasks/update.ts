import { updateStatus, wait, log } from "./lib";
import argv from "../src/getClargs";

const { chainid, rebootMinutes, intervalMinutes } = argv

export const updateOneOff = async () => {
  updateStatus(chainid!).catch(async (e: Error) => {
    log(`Error in ${chainid} update process: ${e.toString()}}`,1)
  });
}

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