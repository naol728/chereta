/*eslint-disable*/
// @ts-nocheck
import { NextFunction, Request, Response } from "express";
import { validateTelegramData } from "../utils/telegram";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import jwt from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

const fetchUserData = async (userId: string) => {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(`*`)
    .eq("id", userId)
    .single();

  if (userError || !user) {
    throw new AppError("User not found", 401);
  }
};
export const telegramAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    const fetchUserData = async (userId: string) => {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select(`*`)
        .eq("id", userId)
        .single();

      if (userError || !user) {
        throw new AppError("User not found", 401);
      }

      return {
        user,
      };
    };

    // =========================================================
    // 1. JWT Authentication
    // =========================================================
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const payload = jwt.verify(token, env.JWT_SECRET) as {
          userId: string;
          telegramId?: number;
        };

        const { user, wagering } = await fetchUserData(payload.userId);

        return res.json({
          access_token: token,
          user,
          wagering,
        });
      } catch (err: any) {
        if (err instanceof AppError) {
          return next(err);
        }

        if (err.name === "JsonWebTokenError") {
          return next(new AppError("Invalid token", 401));
        }

        if (err.name === "TokenExpiredError") {
          return next(new AppError("Token expired", 401));
        }

        console.error("JWT authentication error:", err);

        return next(new AppError("Authentication failed", 401));
      }
    }

    // =========================================================
    // 2. Telegram Authentication
    // =========================================================

    const { initData } = req.body;

    if (!initData) {
      return next(new AppError("initData is required", 400));
    }

    // -----------------------------
    // Validate Telegram initData
    // -----------------------------
    let tgUser;

    try {
      tgUser = validateTelegramData(env.BOT_TOKEN, initData);
    } catch (err) {
      console.error("Telegram validation error:", err);

      return next(new AppError("Invalid Telegram data", 401));
    }

    if (!tgUser?.user?.id) {
      return next(new AppError("Telegram user not found", 401));
    }

    // =========================================================
    // Create / Fetch User
    // =========================================================

    const { data: user, error: userError } = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: tgUser.user.id,
          username: tgUser.user.username ?? null,
          Fname: tgUser.user.first_name ?? null,
          Lname: tgUser.user.last_name ?? null,
        },
        {
          onConflict: "telegram_id",
        },
      )
      .select()
      .single();

    if (userError || !user) {
      console.error("User upsert error:", userError);

      return next(new AppError("Failed to create or fetch user", 500));
    }

    // =========================================================
    // Create JWT
    // =========================================================

    const token = jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegram_id,
      },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // =========================================================
    // Fetch Complete User Data
    // =========================================================

    try {
      const { user } = await fetchUserData(user.id);

      // =======================================================
      // SAME RESPONSE STRUCTURE AS JWT FLOW
      // =======================================================

      return res.json({
        access_token: token,
        user,
      });
    } catch (err) {
      return next(err);
    }
  },
);

interface AuthRequest extends Request {
  user: {
    userId: string;
    telegramId: number;
  };
}

export const me = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const { data } = await supabase
      .from("users")
      .select(
        `*,wallets (
        balance,
        locked_balance
      )`,
      )
      .eq("id", userId)
      .single();
    // const data=await supabase
    if (!data) {
      return next(new AppError("User not Found", 404));
    }
    res.json(data);
  },
);
