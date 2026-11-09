import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import authRoute from "./routes/auth.route";
import AdminRoute from "./routes/admin.route";
import AuctionRoute from "./routes/auction.route";
import { globalErrorHandler } from "./middleware/globalErrorhandler";
import ReferalRoute from "./routes/referal.route";
const app = express();

app.disable("x-powered-by");
app.use(helmet());
// app.use(pinoHttp());

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
app.use("/auction", AuctionRoute);
app.use("/admin", AdminRoute);
app.use("/ref", ReferalRoute);

// app.get("/", (_, res) => {
//   res.send("welcome to chereta");
// });

app.use(globalErrorHandler);
export default app;
