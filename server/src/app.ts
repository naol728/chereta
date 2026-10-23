import express from "express";
const app = express();
app.use(express.json());
app.get("/", (_, res) => {
  res.send("welcome to chereta");
});
export default app;
