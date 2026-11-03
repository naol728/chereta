import express from "express";
import { getAuctionItems,getAuctionItem } from "../controller/auction.controller";
import { requireAuth } from "../middleware/auth";
const AuctionRoute = express.Router();
AuctionRoute.get("/items", requireAuth, getAuctionItems);
AuctionRoute.get("/item/:id", requireAuth, getAuctionItem);
export default AuctionRoute;
