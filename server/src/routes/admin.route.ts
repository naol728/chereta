import express from "express";
import {
  adminAuth,
  createItem,
  getItem,
  getItems,
  deleteItem,
  updateItem
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
AdminRoute.delete("/item/:id",requireAuth, requireAdmin,deleteItem)
AdminRoute.get("/items/:id", requireAuth, requireAdmin, getItem);
AdminRoute.patch(
  "/item/:id",
  requireAuth,
  requireAdmin,
  uploadItemImages,
  updateItem
);

export default AdminRoute;
