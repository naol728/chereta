/*eslint-disable*/
//@ts-nocheck
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { supabase } from "./../config/supabase";
import { randomUUID } from "crypto";
import { AppError } from "../utils/AppError";
import {
  verifyPayment,
  paymentVerify,
  VerifyEtError,
} from "./../service/payment/paymentvarify.service";
import axios from "axios";
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

export const createPaymentOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get authenticated user
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2. Get auction ID and bid amount
    const { id: auctionId } = req.params;
    const { bid_amount } = req.body;

    const amount = Number(bid_amount);

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: "Auction ID is required",
      });
    }

    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Bid amount must be at least 1 ETB",
      });
    }

    // 3. Check whether auction exists
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .select("id")
      .eq("id", auctionId)
      .maybeSingle();

    if (auctionError) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve auction",
      });
    }

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    // 4. Check for an existing active payment order
    const now = new Date().toISOString();

    const { data: existingOrder, error: existingError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("user_id", userId)
      .eq("auction_id", auctionId)
      .in("status", ["awaiting_payment", "submitted", "verifying"])
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({
        success: false,
        message: "Failed to check existing payment order",
      });
    }

    // 5. If an active order exists, reuse it
    if (existingOrder) {
      const { data: paymentMethod, error: methodError } = await supabase
        .from("payment_methods")
        .select(
          "id, name, provider, account_name, account_number, instructions",
        )
        .eq("id", existingOrder.payment_method_id)
        .maybeSingle();

      if (methodError) {
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve payment method",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Existing payment order retrieved",
        data: {
          ...existingOrder,
          payment_method: paymentMethod,
        },
      });
    }

    // 6. Get all active payment methods
    const { data: paymentMethods, error: paymentMethodError } = await supabase
      .from("payment_methods")
      .select("id, name, provider, account_name, account_number, instructions")
      .eq("is_active", true);

    if (paymentMethodError) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve payment methods",
      });
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      return res.status(503).json({
        success: false,
        message: "No payment methods are currently available",
      });
    }

    // 7. Select a random payment method
    const randomIndex = Math.floor(Math.random() * paymentMethods.length);

    const selectedMethod = paymentMethods[randomIndex];

    // 8. Set payment expiration (1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // 9. Create payment order
    const { data: paymentOrder, error: createError } = await supabase
      .from("payment_orders")
      .insert({
        user_id: userId,
        auction_id: auctionId,
        payment_method_id: selectedMethod.id,
        bid_amount: amount,
        currency: "ETB",
        status: "awaiting_payment",
        idempotency_key: randomUUID(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (createError) {
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order",
        error: createError.message,
      });
    }

    // 10. Return payment instructions
    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        ...paymentOrder,
        payment_method: selectedMethod,
      },
    });
  },
);

export const getPendingPaymentOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: auctionId } = req.params;
    const userId = req.user?.userId;

    // ============================================================
    // VALIDATION
    // ============================================================

    if (!auctionId) {
      return next(new AppError("Auction ID is required.", 400));
    }

    if (!userId) {
      return next(new AppError("User authentication required.", 401));
    }

    // ============================================================
    // FETCH ACTIVE PAYMENT ORDER
    // Only awaiting_payment and verifying orders are retrieved.
    // Expired payment orders are excluded.
    // ============================================================

    const now = new Date().toISOString();

    const { data: paymentOrder, error } = await supabase
      .from("payment_orders")
      .select(
        `
        id,
        user_id,
        auction_id,
        payment_method_id,
        bid_amount,
        currency,
        transaction_reference,
        status,
        expires_at,
        paid_at,
        created_at,
        updated_at,

        payment_method:payment_methods (
          id,
          name,
          provider,
          account_name,
          account_number,
          instructions
        ),

        auction:auctions (
          id,
          item_id,
          starting_bid,
          currency,
          starts_at,
          ends_at,
          status,
          total_bids,
          total_revenue,
          created_at,

          item:items (
            id,
            title,
            slug,
            description,
            image_url,
            images,
            category,
            condition,
            status,
            created_at
          )
        )
      `,
      )
      .eq("auction_id", auctionId)
      .eq("user_id", userId)
      .in("status", ["awaiting_payment", "verifying"])
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    // ============================================================
    // HANDLE DATABASE ERROR
    // ============================================================

    if (error) {
      console.error("Get pending payment order error:", error);

      return next(
        new AppError("Failed to retrieve pending payment order.", 500),
      );
    }

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,
      message: paymentOrder
        ? "Pending payment order retrieved successfully."
        : "No pending payment order found.",
      data: paymentOrder,
    });
  },
);

export const deletePaymentOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: auctionId } = req.params;
    const userId = req.user?.userId;

    // ============================================================
    // VALIDATION
    // ============================================================

    if (!auctionId) {
      return next(new AppError("Auction ID is required.", 400));
    }

    if (!userId) {
      return next(new AppError("User authentication required.", 401));
    }

    // ============================================================
    // FIND AND DELETE PAYMENT ORDER
    // Only delete the authenticated user's active payment order.
    // ============================================================

    const { data: deletedOrder, error } = await supabase
      .from("payment_orders")
      .delete()
      .eq("auction_id", auctionId)
      .eq("user_id", userId)
      .in("status", ["awaiting_payment", "verifying"])
      .select("id, auction_id, bid_amount, status")
      .maybeSingle();

    // ============================================================
    // HANDLE DATABASE ERROR
    // ============================================================

    if (error) {
      console.error("Delete payment order error:", error);

      return next(new AppError("Failed to delete payment order.", 500));
    }

    // ============================================================
    // CHECK DELETED ORDER
    // ============================================================

    if (!deletedOrder) {
      return next(
        new AppError("No active payment order found to delete.", 404),
      );
    }

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,
      message: "Payment order deleted successfully.",
      data: deletedOrder,
    });
  },
);

export const submitPaymentTransaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const auctionId = req.params.id;
    const userId = req.user?.userId;

    const transactionReference = String(req.body.transaction_reference || "")
      .trim()
      .toUpperCase();

    // ============================================================
    // 1. VALIDATION
    // ============================================================

    if (!userId) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!auctionId) {
      return next(new AppError("Auction ID is required.", 400));
    }

    if (!transactionReference) {
      return next(new AppError("Transaction reference is required.", 400));
    }

    if (!/^[A-Z0-9]{8,20}$/.test(transactionReference)) {
      return next(new AppError("Invalid transaction reference format.", 400));
    }

    // ============================================================
    // 2. CHECK ALREADY COMPLETED PAYMENT
    // ============================================================

    const { data: completedOrder, error: completedOrderError } = await supabase
      .from("payment_orders")
      .select("id, user_id, auction_id, status, transaction_reference")
      .eq("transaction_reference", transactionReference)
      .eq("user_id", userId)
      .eq("auction_id", auctionId)
      .eq("status", "paid")
      .maybeSingle();

    if (completedOrderError) {
      console.error("Completed payment lookup error:", completedOrderError);
      return next(new AppError("Unable to check payment status.", 500));
    }

    if (completedOrder) {
      return res.status(400).json({
        success: true,
        alreadyProcessed: true,
        message: "This TransactionId is used .",
        data: {
          paymentOrderId: completedOrder.id,
          transactionReference: completedOrder.transaction_reference,
        },
      });
    }

    // ============================================================
    // 3. FIND ACTIVE PAYMENT ORDER
    // ============================================================

    const { data: paymentOrder, error: paymentOrderError } = await supabase
      .from("payment_orders")
      .select(
        `
          id,
          user_id,
          auction_id,
          payment_method_id,
          bid_amount,
          currency,
          transaction_reference,
          idempotency_key,
          status,
          expires_at,
          created_at,
          payment_method:payment_methods (
            id,
            name,
            provider,
            account_name,
            account_number,
            instructions
          ),
          auction:auctions (
            starting_bid
          )
        `,
      )
      .eq("auction_id", auctionId)
      .eq("user_id", userId)
      .eq("status", "awaiting_payment")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentOrderError) {
      console.error("Payment order lookup error:", paymentOrderError);
      return next(new AppError("Unable to retrieve your payment order.", 500));
    }

    if (!paymentOrder) {
      return next(
        new AppError(
          "No active payment order found. Please create a new bid.",
          404,
        ),
      );
    }

    // ============================================================
    // 4. CHECK TRANSACTION REFERENCE ATTACHED TO ORDER
    // ============================================================

    if (
      paymentOrder.transaction_reference &&
      paymentOrder.transaction_reference !== transactionReference
    ) {
      return next(
        new AppError(
          "A different transaction reference is already attached to this payment order.",
          409,
        ),
      );
    }

    // ============================================================
    // 5. CHECK DUPLICATE TRANSACTION REFERENCE
    // ============================================================

    const { data: duplicateOrder, error: duplicateError } = await supabase
      .from("payment_orders")
      .select("id, user_id, auction_id, status")
      .eq("transaction_reference", transactionReference)
      .neq("id", paymentOrder.id)
      .maybeSingle();

    if (duplicateError) {
      console.error("Duplicate transaction lookup error:", duplicateError);
      return next(
        new AppError("Unable to validate transaction reference.", 500),
      );
    }

    if (duplicateOrder) {
      return next(
        new AppError("This transaction reference has already been used.", 409),
      );
    }

    // ============================================================
    // 6. GET PAYMENT METHOD
    // ============================================================

    let paymentMethod = Array.isArray(paymentOrder.payment_method)
      ? paymentOrder.payment_method[0]
      : paymentOrder.payment_method;

    if (!paymentMethod) {
      const { data: fallbackMethod, error: fallbackError } = await supabase
        .from("payment_methods")
        .select(
          `
            id,
            name,
            provider,
            account_name,
            account_number,
            instructions
          `,
        )
        .eq("id", paymentOrder.payment_method_id)
        .maybeSingle();

      if (fallbackError) {
        console.error("Payment method lookup error:", fallbackError);
        return next(new AppError("Unable to retrieve payment method.", 500));
      }

      if (fallbackMethod) {
        paymentMethod = fallbackMethod;
      }
    }

    if (!paymentMethod) {
      return next(new AppError("Payment method configuration not found.", 500));
    }

    // ============================================================
    // 7. VALIDATE PAYMENT METHOD
    // ============================================================

    const settlementAccount = String(paymentMethod.account_number || "").trim();

    const settlementName = String(paymentMethod.account_name || "").trim();

    const provider = String(paymentMethod.provider || "")
      .trim()
      .toLowerCase();

    if (!settlementAccount || !settlementName) {
      return next(
        new AppError("Payment account is not configured correctly.", 500),
      );
    }

    if (provider !== "telebirr") {
      return next(new AppError("Unsupported payment provider.", 400));
    }

    // ============================================================
    // 8. VERIFY TRANSACTION WITH VERIFY.ET
    // ============================================================

    const expectedAmount = Number(paymentOrder.auction.starting_bid);

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return next(new AppError("Invalid payment order amount.", 500));
    }

    let verifyResponse;

    try {
      verifyResponse = await verifyPayment(
        transactionReference,
        settlementAccount,
      );
    } catch (error) {
      console.error("Verify.ET request error:", error);

      if (error instanceof VerifyEtError) {
        const providerStatus = error.status;

        if (providerStatus === 429) {
          return next(
            new AppError(
              error.message ||
                "Too many verification requests. Please try again later.",
              429,
            ),
          );
        }

        if (providerStatus === 400 || providerStatus === 422) {
          return next(
            new AppError(
              error.message || "Invalid transaction reference.",
              400,
            ),
          );
        }

        return next(
          new AppError(
            "Payment verification service is temporarily unavailable. Please try again.",
            503,
          ),
        );
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          return next(
            new AppError(
              "Payment verification timed out. Please try again using the same transaction reference.",
              503,
            ),
          );
        }
      }

      return next(
        new AppError(
          "Unable to connect to the payment verification service.",
          503,
        ),
      );
    }

    // ============================================================
    // 9. VALIDATE VERIFY.ET RESPONSE
    // ============================================================

    const verification = paymentVerify(
      verifyResponse,
      expectedAmount,
      settlementName,
      settlementAccount,
    );

    if (verification.pending) {
      return res.status(202).json({
        success: false,
        pending: true,
        retryable: true,
        message: verification.message,
      });
    }

    if (!verification.valid) {
      return next(
        new AppError(verification.message, verification.retryable ? 503 : 400),
      );
    }

    // ============================================================
    // 10. COMPLETE PAYMENT AND CREATE BID ATOMICALLY
    // ============================================================

    const { data: completion, error: completionError } = await supabase.rpc(
      "complete_verified_bid_payment",
      {
        p_payment_order_id: paymentOrder.id,
        p_user_id: userId,
        p_transaction_reference: transactionReference,
      },
    );

    if (completionError) {
      console.error("Complete verified payment RPC error:", completionError);

      const rpcCode = completionError.code;

      if (rpcCode === "23505" || rpcCode === "P0003") {
        return next(
          new AppError(
            "You have already placed this bid or this transaction has already been used.",
            409,
          ),
        );
      }

      if (rpcCode === "P0002") {
        return next(new AppError("Payment order not found.", 404));
      }

      if (rpcCode === "P0004" || rpcCode === "P0005") {
        return next(
          new AppError(
            completionError.message ||
              "Payment order or auction is no longer available.",
            409,
          ),
        );
      }

      if (rpcCode === "P0006") {
        return next(new AppError("Invalid transaction reference.", 400));
      }

      return next(
        new AppError(
          "Unable to complete your payment. Please contact support.",
          500,
        ),
      );
    }

    // ============================================================
    // 11. SUCCESS RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,
      message: "Payment verified and bid placed successfully.",
      data: completion,
    });
  },
);

export const getMyAuction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new AppError("You must be logged in.", 401));
    }

    const { data: bids, error } = await supabase
      .from("auction_bids")
      .select(
        `
        *,
        auction:auctions!auction_bids_auction_id_fkey (
          *,
          item:items!auctions_item_id_fkey (*)
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return next(new AppError("Failed to fetch your auctions.", 500));
    }

    if (!bids || bids.length === 0) {
      return res.status(200).json({
        success: true,
        results: 0,
        data: [],
      });
    }

    const auctionIds = [...new Set(bids.map((bid) => bid.auction_id))];

    const { data: allBids, error: allBidsError } = await supabase
      .from("auction_bids")
      .select("auction_id, bid_amount")
      .in("auction_id", auctionIds);

    if (allBidsError) {
      return next(new AppError("Failed to check bid uniqueness.", 500));
    }

    const bidCounts = new Map<string, number>();

    for (const bid of allBids || []) {
      const key = `${bid.auction_id}:${Number(bid.bid_amount)}`;

      bidCounts.set(key, (bidCounts.get(key) || 0) + 1);
    }

    const data = bids.map((bid) => {
      const key = `${bid.auction_id}:${Number(bid.bid_amount)}`;
      const count = bidCounts.get(key) || 0;

      return {
        ...bid,
        is_unique: count === 1,
      };
    });

    return res.status(200).json({
      success: true,
      results: data.length,
      data,
    });
  },
);

export const getPreviousAuctions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new AppError("You must be logged in.", 401));
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const {
      data: winners,
      error,
      count,
    } = await supabase
      .from("auction_winners")
      .select(
        `
          *,
          auction:auctions!auction_winners_auction_id_fkey (
            *,
            item:items!auctions_item_id_fkey (
              *
            ),
            bids:auction_bids!auction_bids_auction_id_fkey (
              id,
              bid_amount,
              created_at,
              paid_at
            )
          ),
          winning_bid:auction_bids!auction_winners_winning_bid_id_fkey (
            *
          )
        `,
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return next(new AppError("Failed to fetch previous auctions.", 500));
    }

    const formattedAuctions = (winners || []).map((winner) => {
      const auction = winner.auction;

      return {
        ...winner,

        auction: auction
          ? {
              ...auction,

              item: auction.item,

              total_bids: auction.bids?.length || 0,

              winning_bid: winner.winning_bid,

              my_bids: (auction.bids || []).filter(
                (bid: { id: string }) => bid.id === winner.winning_bid_id,
              ),
            }
          : null,
      };
    });

    return res.status(200).json({
      status: "success",
      results: formattedAuctions.length,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: page * limit < (count || 0),
        hasPreviousPage: page > 1,
      },
      data: {
        auctions: formattedAuctions,
      },
    });
  },
);

export const getSetteledAuctions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const {
      data: winners,
      error,
      count,
    } = await supabase
      .from("auction_winners")
      .select(
        `
          id,
          auction_id,
          winning_amount,
          created_at,

          winner:users!auction_winners_user_id_fkey (
            id,
            username,
            Fname,
            Lname
          ),

          winning_bid:auction_bids!auction_winners_winning_bid_id_fkey (
            id,
            bid_amount,
            paid_at,
            created_at
          ),

          auction:auctions!auction_winners_auction_id_fkey (
            id,
            currency,
            starting_bid,
            starts_at,
            ends_at,
            total_bids,

            item:items!auctions_item_id_fkey (
              id,
              title,
              slug,
              image_url,
              images,
              category,
              condition
            )
          )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return next(new AppError("Failed to fetch latest auction winners.", 500));
    }

    return res.status(200).json({
      status: "success",
      results: winners?.length || 0,

      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: page * limit < (count || 0),
        hasPreviousPage: page > 1,
      },

      data: {
        winners: winners || [],
      },
    });
  },
);
