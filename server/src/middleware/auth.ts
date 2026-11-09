// middleware/auth.ts
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken, JwtPayload } from "./../service/token.service";
import { supabase } from "../config/supabase";
import { catchAsync } from "../utils/catchAsync";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const requireAuth = catchAsync(
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next(new AppError("Authentication required", 401));
    }

    const token = authHeader.split(" ")[1];

    const payload = verifyAccessToken(token); // 💥 throws if invalid

    req.user = payload;

    next();
  },
);

export const requireAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new AppError("Unauthorized. Please login first.", 401));
    }

    const { data: admin, error } = await supabase
      .from("auction_admins")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return next(new AppError("Failed to verify admin permissions.", 500));
    }

    if (!admin) {
      return next(new AppError("Forbidden. Admin access required.", 403));
    }

    next();
  },
);
