import express from "express";
import {
  getAuctionItems,
  getAuctionItem,
  getEndedAuctions,
  createPaymentOrder,
  getPendingPaymentOrder,
  deletePaymentOrder,
  submitPaymentTransaction,
  getMyAuction,
  getPreviousAuctions,
} from "../controller/auction.controller";
import { requireAuth } from "../middleware/auth";
const AuctionRoute = express.Router();
AuctionRoute.get("/items/live", requireAuth, getAuctionItems);
AuctionRoute.get("/ended", requireAuth, getEndedAuctions);
AuctionRoute.get("/item/:id", requireAuth, getAuctionItem);
AuctionRoute.post("/:id/payment-order", requireAuth, createPaymentOrder);
AuctionRoute.post(
  "/:id/submitpaymenttrxid",
  requireAuth,
  submitPaymentTransaction,
);
AuctionRoute.delete("/:id/payment-order", requireAuth, deletePaymentOrder);
AuctionRoute.get(
  "/:id/my-pending-payment-order",
  requireAuth,
  getPendingPaymentOrder,
);
AuctionRoute.get("/my-bids", requireAuth, getMyAuction);
AuctionRoute.get("/previous", requireAuth, getPreviousAuctions);
export default AuctionRoute;
