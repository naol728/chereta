import express from "express";
import { telgramAuth } from "../controller/auth.controller";
const authRoute = express.Router();

authRoute.post("/telegram", telgramAuth);
export default authRoute;
