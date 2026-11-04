import express from "express";
import {
  getAuctionItems,
  getAuctionItem,
  getEndedAuctions,
} from "../controller/auction.controller";
import { requireAuth } from "../middleware/auth";
const AuctionRoute = express.Router();
AuctionRoute.get("/items/live", requireAuth, getAuctionItems);
AuctionRoute.get("/ended", requireAuth, getEndedAuctions);
AuctionRoute.get("/item/:id", requireAuth, getAuctionItem);
export default AuctionRoute;
