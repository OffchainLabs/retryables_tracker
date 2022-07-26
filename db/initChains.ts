
import ArbChain from "./models/Arbchain";
require("dotenv").config();

(()=>{
    ArbChain.create({
        id: 42161,
        lastBlockChecked: 15213283,
        l2rpcURL: "https://Arb1-graph.arbitrum.io/rpc",
        l1rpcURL: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID,
        inboxAddress: "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f"
      })


      ArbChain.create({
        id: 42170,
        lastBlockChecked: 15219858,
        l2rpcURL: "https://a4ba.arbitrum.io/rpc",
        l1rpcURL: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID,
        inboxAddress: "0xc4448b71118c9071bcb9734a0eac55d18a153949"
      })



})()
