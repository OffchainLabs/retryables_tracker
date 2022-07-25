import { Sequelize, DataTypes } from "sequelize";
import db from "../config";
const ArbChain = db.define("Arbchain", {
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true
  },
  lastBlockChecked: DataTypes.INTEGER.UNSIGNED,
  l2rpcURL: DataTypes.STRING,
  l1rpcURL: DataTypes.STRING,
  inboxAddress: DataTypes.STRING
});

export default ArbChain;
