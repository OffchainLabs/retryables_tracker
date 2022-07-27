import { updateStatus, wait } from "./lib";
import yargs from "yargs/yargs";

const { chainid, rebootMinutes, intervalMinutes } = yargs(process.argv.slice(2))
  .options({
    chainid: { type: "number", demandOption: true, alias: "id" },
    rebootMinutes: {
      type: "number",
      default: 60
    },
    intervalMinutes: { type: "number", default: 5 }
  })
  .parseSync();

const updateProcess = async () => {
  while (true) {
    await updateStatus(chainid);
    await wait(intervalMinutes * 1000 * 60);
  }
};

updateProcess().catch(async (e: Error) => {
  console.log("error", e);
  console.log("starting again in ", rebootMinutes);

  setTimeout(updateProcess, 1000 * 60 * rebootMinutes);
});

process.on("uncaughtException", async function(e) {
    setTimeout(updateProcess, 1000 * 60 * rebootMinutes);
  });
  