import Arbchain from "./Arbchain"
import Retryable from "./Retryable"

Arbchain.hasMany(Retryable)
Retryable.belongsTo(Arbchain)

export {
    Arbchain,
    Retryable
}