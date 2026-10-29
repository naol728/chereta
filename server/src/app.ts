import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import authRoute from "./routes/auth.route";
import { globalErrorHandler } from "./middleware/globalErrorhandler";
const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(pinoHttp());

app.use(express.json());
app.use(cors());
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Chereta API is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
  });
});
app.use("/auth", authRoute);

// app.get("/", (_, res) => {
//   res.send("welcome to chereta");
// });

app.use(globalErrorHandler);
export default app;
