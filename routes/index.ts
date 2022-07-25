import express, { Application, Request, Response } from "express";
import db from '../db/config'
const app: Application = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
try {
    db.authenticate();
    console.log('DB successfully connected.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }



app.get(
  "/",
  async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).send({
      message: `hi`
    });
  }
);

try {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
} catch (error:any) {
  console.log(`Error occurred: ${error.message}`);
}
