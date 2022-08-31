import ArbChain from "./models/Arbchain";
import Retryable from "./models/Retryable";


export const resetDBProgress =async () => {
  await ArbChain.sync({ force: true });
  await Retryable.sync({ force: true });
}