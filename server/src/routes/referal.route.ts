import express from "express";
import { getMyReferalStat } from "../controller/referal.controller";
import { requireAuth } from "../middleware/auth";
const ReferalRoute = express.Router();
ReferalRoute.get("/stat", requireAuth, getMyReferalStat);
export default ReferalRoute;
