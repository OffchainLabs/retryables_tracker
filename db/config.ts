import { Dialect, Sequelize } from "sequelize";
require("dotenv").config();

const dbName = process.env.DB_NAME as string;
const dbUser = process.env.DB_USER as string;
const dbHost = process.env.DB_HOST;
const dbDriver = "postgres" as Dialect;
const dbPassword = process.env.DB_PASSWORD;

const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
  dialect: dbDriver
});

export default sequelizeConnection;
