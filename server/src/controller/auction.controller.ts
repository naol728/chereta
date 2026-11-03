import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { supabase } from "./../config/supabase";

export const getAuctionItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    let query = supabase
      .from("items")
      .select("*", { count: "exact" })
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data: items, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch auction items",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched auction items",
      data: {
        items,
        pagination: {
          total: count ?? 0,
          page,
          limit,
          totalPages: Math.ceil((count ?? 0) / limit),
          hasNextPage: to + 1 < (count ?? 0),
          hasPreviousPage: page > 1,
        },
      },
    });
  },
);

export const getAuctionItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Validate UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof id !== "string" || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const { data: item, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("Get auction item error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch auction item",
      });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Auction item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched auction item",
      data: {
        item,
      },
    });
  },
);
