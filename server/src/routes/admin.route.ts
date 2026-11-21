import express from "express";
import {
  adminAuth,
  createItem,
  getItem,
  getItems,
  deleteItem,
  updateItem,
  getAuctions,
  createAuction,
  updateAuction,
  getAuctionBids,
  getPaymentOrders,
  getAuctionSettlements,
  getAdminOverview,
} from "../controller/admin.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";
import uploadItemImages from "../middleware/uploadItemImages";
const AdminRoute = express.Router();

AdminRoute.get("/auth", requireAuth, adminAuth);
AdminRoute.get("/items", requireAuth, requireAdmin, getItems);
AdminRoute.post(
  "/item",
  requireAuth,
  requireAdmin,
  uploadItemImages,
  createItem,
);
AdminRoute.delete("/item/:id", requireAuth, requireAdmin, deleteItem);
AdminRoute.get("/items/:id", requireAuth, requireAdmin, getItem);
AdminRoute.patch(
  "/item/:id",
  requireAuth,
  requireAdmin,
  uploadItemImages,
  updateItem,
);
AdminRoute.get("/auctions", requireAuth, requireAdmin, getAuctions);
AdminRoute.post("/auction", requireAuth, requireAdmin, createAuction);
AdminRoute.patch("/auctions/:id", requireAuth, requireAdmin, updateAuction);
AdminRoute.get("/auction-bids", requireAuth, requireAdmin, getAuctionBids);
AdminRoute.get("/payment-orders", requireAuth, requireAdmin, getPaymentOrders);
AdminRoute.get(
  "/auction-settlements",
  requireAuth,
  requireAdmin,
  getAuctionSettlements,
);
AdminRoute.get("/overview", requireAuth, requireAdmin, getAdminOverview);
export default AdminRoute;
