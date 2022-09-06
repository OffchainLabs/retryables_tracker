import  argv  from './getClargs';
import {syncRetryablesProcess} from "../tasks/sync";
import {updateProcess} from "../tasks/update";
import {reportUnredeemedProcess} from "../tasks/report";
import {sentDontReportProgress} from "../tasks/setDontReport";
import {appProgress} from "../routes/index";
import {resetDBProgress} from "../db/resetDB";
import {initChainsProgress} from "../db/initChains";
import { exit } from 'process';


const main = async () => {
    switch (argv.action) {
        case "sync":
            if(!argv.chainid) {
                console.error("Error: arg chainid needed");
                exit(1);
            }
            return syncRetryablesProcess();

        case "update":
            if(!argv.chainid) {
                console.error("Error: arg chainid needed");
                exit(1);
            }
            return updateProcess();

        case "report":
            if(!argv.chainids) {
                console.error("Error: arg chainids needed");
                exit(1);
            }
            return reportUnredeemedProcess();
            
        case "start_server":
            return appProgress();

        case "init_db":
            if(!process.env.L2_ONE_RPC || !process.env.L2_NOVA_RPC) {
                if(!process.env.L2_ONE_RPC) console.error("Error: env L2_ONE_RPC needed");
                if(!process.env.L2_NOVA_RPC) console.error("Error: env L2_NOVA_RPC needed");
                exit(1);
            }
            await resetDBProgress();
            return initChainsProgress();

        case "set_dont_report":
            if(!argv.l1TxHash || !argv.msgIndex || !argv.chainid || !argv.explanation) {
                if(!argv.l1TxHash) console.error("Error: arg l1TxHash needed");
                if(!argv.msgIndex) console.error("Error: arg msgIndex needed");
                if(!argv.chainid) console.error("Error: arg chainid needed");
                if(!argv.explanation) console.error("Error: arg explanation needed");
                exit(1);
            }
            
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

