import  argv  from './getClargs';
import {syncRetryablesProcess} from "../tasks/sync";
import {updateProcess} from "../tasks/update";
import {reportUnredeemedProcess} from "../tasks/report";
import {sentDontReportProgress} from "../tasks/setDontReport";
import {appProgress} from "../routes/index";
import {resetDBProgress} from "../db/resetDB";
import {initChainsProgress} from "../db/initChains";


const main = async () => {
    switch (argv.action) {
        case "sync":
            if(!argv.chainid) throw new Error("Error: arg chainid needed");
            return syncRetryablesProcess();

        case "update":
            if(!argv.chainid) throw new Error("Error: arg chainid needed");
            return updateProcess();

        case "report":
            if(!argv.chainids) throw new Error("Error: arg chainids needed");
            return reportUnredeemedProcess();
            
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
            if(!argv.msgIndex) throw new Error("Error: arg msgIndex needed");
            if(!argv.chainid) throw new Error("Error: arg chainid needed");
            if(!argv.explanation) throw new Error("Error: arg explanation needed");
            
            return sentDontReportProgress();

        default:
            throw new Error("Not a right action value");
    }
}

main()
.then(() => console.log("Done!"))
  .catch((err) => {
    console.error(JSON.stringify(err));
    throw err;
  });