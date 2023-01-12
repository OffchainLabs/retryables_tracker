/*
 * Copyright 2021, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// import yargs from 'yargs/yargs';
'use strict';
import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(2))
  .options({
    action: {
      type: 'string',
    },
    chainids: {
        type: "array",
        alias: "ids",
        default: [42161],
        description: "Chain Ids to report on",
        number: true
    },
    rebootMinutes: {
        type: "number",
        default: 1,
        description: "Pause time if error occurs before restarting process"
    },
    intervalHours: { 
        type: "number", 
        default: 12, 
        description: "Frequency (hours) over which to report" 
    },
    blocksperquery: { 
        type: "number", 
        default: 1000, 
        alias: "blocks", 
        description: "Number of blocks in range of each inbox event query" 
    },
    chainid: { 
        type: "number", 
        //demandOption: true, 
        alias: "id", 
        description: "Chain to sync" 
    },
    blocksFromTip: { 
        type: "number", 
        default: 120, 
        description: "Distance from tip of L1 chain (in blocks) at which to pause scanning and wait (want to give some buffer for retryables to be included by the sequencer)" 
    },
    intervalMinutes: { 
        type: "number", 
        default: 3, 
        description: "Frequency at which to check for updated status" 
    },
    l1TxHash: {
        type: "string",
        //demandOption: true,
        description: "Target Tx Hash"
      },
      msgIndex: {
        type: "number",
        //demandOption: true,
        description: "Target Tx msg number"
      },
      explanation: {
        type: "string",
        //demandOption: true,
        description: ""
      },
      oneOff: {
        type: "boolean",
        default: false
      }
      
  })
  .demandOption('action')
  .parseSync();

  
export default argv;