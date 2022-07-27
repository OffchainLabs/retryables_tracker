import { syncRetryables } from "./lib";

import yargs from "yargs/yargs";

const { blocksperquery, chainid, blocksFromTip, rebootMinutes } = yargs(
  process.argv.slice(2)
)
  .options({
    blocksperquery: { type: "number", default: 1000, alias: "blocks" },
    chainid: { type: "number", demandOption: true, alias: "id" },
    blocksFromTip: { type: "number", default: 120 },
    rebootMinutes: { type: "number", default: 60 }
  })
  .parseSync();

const syncRetryablesProcess = () => {
  syncRetryables(chainid, blocksperquery, blocksFromTip).catch(
    async (e: Error) => {
      console.log("error", e);
      console.log("starting again in ", rebootMinutes);

      setTimeout(syncRetryablesProcess, 1000 * 60 * rebootMinutes);
    }
  );
};

process.on("uncaughtException", async function(e) {
  setTimeout(syncRetryablesProcess, 1000 * 60 * rebootMinutes);
});

syncRetryablesProcess();
