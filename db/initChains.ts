
import ArbChain from "./models/Arbchain";
import {
  getL2Network
} from "@arbitrum/sdk-nitro/dist/lib/dataEntities/networks"
import ethers from "ethers"
require("dotenv").config();

const l2OneRpc  = process.env.L2_ONE_RPC as string
const l2NovaRpc  = process.env.L2_NOVA_RPC as string
const l1EthereumRpc = process.env.ETHEREUM_L1_RPC as string
const lastBlockCheckedOne = process.env.LAST_BLOCK_CHECKED_ONE
const lastBlockCheckedNova = process.env.LAST_BLOCK_CHECKED_NOVA

//get inbox's address using arbitrum sdk
const getInbox = async (rpc:string) => {
  const provider = new ethers.providers.JsonRpcProvider(rpc)
  const chainID = provider.network.chainId
  let l2Network = await getL2Network(chainID)
  return l2Network.ethBridge.inbox
}

export const initChainsProgress = async () => {
  await ArbChain.create({
    id: 42161,
    lastBlockChecked: lastBlockCheckedOne,
    l2rpcURL: l2OneRpc,
    l1rpcURL: l1EthereumRpc,
    inboxAddress: await getInbox(l2OneRpc)
  })


  await ArbChain.create({
    id: 42170,
    lastBlockChecked: lastBlockCheckedNova,
    l2rpcURL: l2NovaRpc,
    l1rpcURL: l1EthereumRpc,
    inboxAddress: await getInbox(l2NovaRpc)
  })
}
