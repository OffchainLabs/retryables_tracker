import  argv  from './getClargs';
import {syncRetryablesProcess, syncRetryablesOneOff} from "../tasks/sync";
import {updateProcess, updateOneOff} from "../tasks/update";
import {reportUnredeemedProcess, reportUnredeemedOneOff} from "../tasks/report";
import {sentDontReportProgress} from "../tasks/setDontReport";
import {appProgress} from "../routes/index";
import {resetDBProgress} from "../db/resetDB";
import {initChainsProgress} from "../db/initChains";
import { log } from "../tasks/lib";
const { oneOff, action }  = argv

const main = async () => {
    switch (action) {
        case "sync":
            if(!argv.chainid) throw new Error("Error: arg chainid needed");
            return await (oneOff ? syncRetryablesOneOff() :  syncRetryablesProcess());

        case "update":
            if(!argv.chainid) throw new Error("Error: arg chainid needed");
            return await (oneOff ? updateOneOff() : updateProcess());

        case "report":
            if(!argv.chainids) throw new Error("Error: arg chainids needed");
            return await (oneOff ? reportUnredeemedOneOff() : reportUnredeemedProcess());
            
        case "start_server":
            return appProgress();

        case "init_db":
            if(!process.env.L2_ONE_RPC) throw new Error("Error: env L2_ONE_RPC needed");
            if(!process.env.L2_NOVA_RPC) throw new Error("Error: env L2_NOVA_RPC needed");
            if(!process.env.ETHEREUM_L1_RPC) throw new Error("Error: env ETHEREUM_L1_RPC needed");
            if(!process.env.LAST_BLOCK_CHECKED_ONE) throw new Error("Error: env LAST_BLOCK_CHECKED_ONE needed");
            if(!process.env.LAST_BLOCK_CHECKED_NOVA) throw new Error("Error: env LAST_BLOCK_CHECKED_NOVA needed");

            await resetDBProgress();
            return initChainsProgress();

        case "set_dont_report":
            if(!argv.l1TxHash) throw new Error("Error: arg l1TxHash needed");
            if(typeof argv.msgIndex !== 'number') throw new Error("Error: arg msgIndex needed");
            if(!argv.chainid) throw new Error("Error: arg chainid needed");
            if(!argv.explanation) throw new Error("Error: arg explanation needed");
            
            return sentDontReportProgress();

        default:
            throw new Error("Not a right action value");
    }
}

const restartNewService = (service: () => void) => {
    log(`Process will restart in ${argv.rebootMinutes}`, 1);
    setTimeout(service, 1000 * 60 * argv.rebootMinutes);
}

process.on("uncaughtException", async function(e) {
    switch (action) {
        case "sync":
            log(`Uncaught exception in ${argv.chainids.join(",")} ${action} process: ${e.toString()}`, 1);
            oneOff ? log("One-off sync process shutdown...") : restartNewService(syncRetryablesProcess);
            break;

        case "update":
            log(`Uncaught exception in ${argv.chainid} ${action} process: ${e.toString()}`, 1)
            oneOff ? log("One-off update process shutdown...") : restartNewService(updateProcess);
            break;

        case "report":
            log(`Uncaught exception in ${argv.chainids.join(",")} ${action} process: ${e.toString()}`, 1)
            oneOff ? log("One-off report process shutdown...") : restartNewService(reportUnredeemedProcess);
            break;
        
        default:
            log(`Uncaught exception in ${action} process: ${e.toString()}. Process shutdown...`, 1)
    }
});

main()
.then(() => console.log("Done!"))
  .catch((err) => {
    console.error(JSON.stringify(err));
    throw err;
  });