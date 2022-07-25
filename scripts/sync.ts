import ArbChain from '../db/models/Arbchain' 

const syncChain = async (chainID: number)=>{
    const chain = await ArbChain.findByPk(chainID)

    if(!chain) throw new Error(`Chain ${chainID} from found`)
    
}
