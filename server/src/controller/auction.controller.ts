import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { supabase } from "./../config/supabase";

export const getAuctionItems = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    let query = supabase
      .from("auctions")
      .select(
        `
          *,
          item:items (
            id,
            title,
            slug,
            description,
            image_url,
            images,
            category,
            condition
          )
        `,
        { count: "exact" },
      )
      .eq("status", "live")
      .order("ends_at", { ascending: true })
      .range(from, to);

    // Filter by item category
    if (category) {
      query = query.eq("item.category", category);
    }

    // Search by item title
    if (search) {
      query = query.ilike("item.title", `%${search}%`);
    }

    const { data: auctions, error, count } = await query;

    if (error) {
      console.error("Get live auctions error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch live auctions",
      });
    }

    const total = count ?? 0;

    return res.status(200).json({
      success: true,
      message: "Successfully fetched live auctions",
      data: {
        auctions: auctions ?? [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: to + 1 < total,
          hasPreviousPage: page > 1,
        },
      },
    });
  },
);

export const getAuctionItem = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate auction UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof id !== "string" || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid auction ID",
      });
    }

    // Fetch auction with item, settlement, winning bid and winner
    const { data: auction, error } = await supabase
      .from("auctions")
      .select(
        `
        *,
        item:items (
          *
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Get auction detail error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch auction details",
      });
    }

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched auction details",
      data: {
        auction,
      },
    });
  },
);

export const getEndedAuctions = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const {
      data: auctions,
      error,
      count,
    } = await supabase
      .from("auctions")
      .select(
        `
          *,
          item:items (
            id,
            title,
            slug,
            description,
            image_url,
            images,
            category,
            condition
          ),
          settlement:auction_settlements (
            outcome,
            winning_amount,
            winner_user_id,
            winning_bid_id,
            admin_decision,
            settled_at
          )
        `,
        { count: "exact" },
      )
      .eq("status", "ended")
      .order("ends_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Get ended auctions error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch ended auctions",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched ended auctions",
      data: {
        auctions,
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
