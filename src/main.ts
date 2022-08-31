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
            return syncRetryablesProcess()

        case "update":
            return updateProcess()

        case "report":
            return reportUnredeemedProcess()
            
        case "start_server":
            return appProgress()

        case "init_db":
            await resetDBProgress()
            return initChainsProgress()

        case "set_dont_report":
            return sentDontReportProgress()

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