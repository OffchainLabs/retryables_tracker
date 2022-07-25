import { DataTypes } from "sequelize";
import db from "../config";

const Retryable = db.define("Retryable", {
  // Model attributes are defined here
  status: DataTypes.INTEGER,
  l1TxHash: DataTypes.STRING,
  msgIndex: DataTypes.INTEGER
});

export default Retryable;
