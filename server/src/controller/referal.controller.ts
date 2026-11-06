import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { supabase } from "../config/supabase";

export const getMyReferalStat = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    // Get the user's referral code
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("referral_id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return next(new AppError("User not found", 404));
    }

    // Calculate date boundaries
    const now = new Date();

    // Ethiopia timezone (UTC+3)
    const ethiopiaOffset = 3 * 60;
    const localNow = new Date(now.getTime() + ethiopiaOffset * 60 * 1000);

    const today = new Date(localNow);
    today.setUTCHours(0, 0, 0, 0);

    const todayStart = new Date(today.getTime() - ethiopiaOffset * 60 * 1000);

    const weekStart = new Date(todayStart);
    const dayOfWeek = (today.getUTCDay() + 6) % 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);

    const monthStart = new Date(
      Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), 1) -
        ethiopiaOffset * 60 * 1000,
    );

    // Fetch referral statistics (no referred user list)
    const [totalResult, todayResult, weekResult, monthResult] =
      await Promise.all([
        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", userId),

        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", userId)
          .gte("created_at", todayStart.toISOString()),

        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", userId)
          .gte("created_at", weekStart.toISOString()),

        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", userId)
          .gte("created_at", monthStart.toISOString()),
      ]);

    const error =
      totalResult.error ||
      todayResult.error ||
      weekResult.error ||
      monthResult.error;

    if (error) {
      return next(new AppError("Failed to fetch referral statistics", 500));
    }

    return res.status(200).json({
      success: true,
      message: "Referral statistics fetched successfully",
      data: {
        referralCode: user.referral_id,
        referralLink: `https://t.me/cheretas_bot?start=ref_${user.referral_id}`,
        totalReferrals: totalResult.count || 0,
        todayReferrals: todayResult.count || 0,
        thisWeekReferrals: weekResult.count || 0,
        thisMonthReferrals: monthResult.count || 0,
      },
    });
  },
);
