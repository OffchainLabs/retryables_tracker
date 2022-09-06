
import ArbChain from "./models/Arbchain";
require("dotenv").config();

export const initChainsProgress = async () => {
  await ArbChain.create({
    id: 42161,
    lastBlockChecked: 15210167,
    l2rpcURL: process.env.L2_ONE_RPC,
    l1rpcURL: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID,
    inboxAddress: "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f"
  })


  await ArbChain.create({
    id: 42170,
    lastBlockChecked: 15219858,
    l2rpcURL: process.env.L2_NOVA_RPC,
    l1rpcURL: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID,
    inboxAddress: "0xc4448b71118c9071bcb9734a0eac55d18a153949"
  })
}
