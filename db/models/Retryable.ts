import { DataTypes } from "sequelize";
import db from "../config";

const Retryable = db.define("Retryable", {
  // Model attributes are defined here
  status: DataTypes.INTEGER,
  l1TxHash: { type: DataTypes.STRING, unique: "message" },
  msgIndex: { type: DataTypes.INTEGER, unique: "message" },
  ArbchainId: { type: DataTypes.INTEGER, unique: "message" },
  l1BlockNumber: { type: DataTypes.INTEGER }
});

export default Retryable;
