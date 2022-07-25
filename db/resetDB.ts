import ArbChain from "./models/Arbchain";
import Retryable from "./models/Retryable";

(async () => {
  ArbChain.hasMany(Retryable)
  Retryable.hasOne(ArbChain)
  await ArbChain.sync({ force: true });
  await Retryable.sync({ force: true });



})();
