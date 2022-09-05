import express, { Application, Request, Response } from "express";
import db from "../db/config";
import { Arbchain, Retryable } from "../db/models";
import { L1ToL2MessageStatus } from "@arbitrum/sdk";
require("dotenv").config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get(
  "/",
  async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).send({
      message: `hi`
    });
  }
);

app.get(
  "/unredeemed/mainnet",
  async (req: Request, res: Response): Promise<Response> => {
    const attributes = [
      "l1TxHash",
      "msgIndex",
      "ArbchainId",
      "createdAt",
      "l1TimestampCreated"
    ];
    const arb1Results = await Retryable.findAll({
      where: {
        ArbchainId: 42161,
        status: L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2,
        dontReport: false
      },
      attributes,
      include: [{ model: Arbchain, attributes: ["lastBlockChecked"] }]
    });

    const novaResults = await Retryable.findAll({
      where: {
        ArbchainId: 42170,
        status: L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2,
        dontReport: false
      },
      attributes,
      include: [{ model: Arbchain, attributes: ["lastBlockChecked"] }]
    });

    return res.status(200).json({
      data: {
        42161: arb1Results,
        42170: novaResults
      },
      totalUnredeemed: novaResults.length + arb1Results.length
    });
  }
);

app.get(
  "/unredeemed/:chainID",
  async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).send({
      message: `todo`
    });
  }
);

export const appProgress =async () => {
  try {
    db.authenticate();
    console.log("DB successfully connected.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
  try {
    app.listen(port, () => {
      console.log(`Server running on ${port}`);
    });
  } catch (error) {
    console.log(`Error occurred:`);
    console.log(error);
  }
}
  
