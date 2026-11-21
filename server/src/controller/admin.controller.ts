//@ts-nocheck
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { supabase } from "../config/supabase";

import { randomUUID } from "crypto";
import path from "path";
import slugify from "slugify";

export const adminAuth = catchAsync(
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

    return res.status(200).json({
      success: true,
      message: "Admin access granted.",
      data: {
        role: admin.role,
        isAdmin: true,
      },
    });
  },
);

export const getItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = "1", limit = "10", search, category, status } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("items").select("*", { count: "exact" });

    // Search by title
    if (search && typeof search === "string") {
      query = query.ilike("title", `%${search}%`);
    }

    // Filter by category
    if (category && typeof category === "string") {
      query = query.eq("category", category);
    }

    // Filter by status
    if (status && typeof status === "string") {
      query = query.eq("status", status);
    }

    const {
      data: items,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) {
      return next(new AppError("Failed to fetch items.", 500));
    }

    return res.status(200).json({
      success: true,
      message: "Items fetched successfully.",
      data: {
        items,
        pagination: {
          totalItems: count ?? 0,
          currentPage: pageNumber,
          pageSize,
          totalPages: Math.ceil((count ?? 0) / pageSize),
          hasNextPage: to + 1 < (count ?? 0),
          hasPrevPage: pageNumber > 1,
        },
      },
    });
  },
);

export const getItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Validate item ID
    if (!id) {
      return next(new AppError("Item ID is required.", 400));
    }

    const { data: item, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return next(new AppError("Item not found.", 404));
      }

      return next(new AppError(error.message, 500));
    }

    res.status(200).json({
      success: true,
      message: "Successfully fetched item details.",
      data: {
        item,
      },
    });
  },
);

const BUCKET_NAME = "items";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const createItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      title,
      description,
      category,
      condition = "new",
      status = "draft",
    } = req.body;

    const files = (req.files || []) as Express.Multer.File[];

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return next(new AppError("Item title is required.", 400));
    }

    // Validate condition
    const allowedConditions = ["new", "used", "refurbished"];

    if (!allowedConditions.includes(condition)) {
      return next(new AppError("Invalid item condition.", 400));
    }

    // Validate status
    const allowedStatuses = ["draft", "published", "archived"];

    if (!allowedStatuses.includes(status)) {
      return next(new AppError("Invalid item status.", 400));
    }

    // Generate unique slug
    const slug = `${slugify(title.trim(), {
      lower: true,
      strict: true,
      trim: true,
    })}-${randomUUID().slice(0, 8)}`;

    const uploadedPaths: string[] = [];
    const imageUrls: string[] = [];

    try {
      // Upload images to Supabase Storage
      for (const file of files) {
        const extension = MIME_EXTENSIONS[file.mimetype];

        const filePath = `${new Date().getFullYear()}/${randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
            cacheControl: "31536000",
          });

        if (uploadError) {
          throw new AppError(
            `Image upload failed: ${uploadError.message}`,
            500,
          );
        }

        uploadedPaths.push(filePath);

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        imageUrls.push(data.publicUrl);
      }

      // Insert item into database
      const { data: item, error: insertError } = await supabase
        .from("items")
        .insert({
          title: title.trim(),
          slug,
          description: description || null,
          category: category || null,
          condition,
          status,
          image_url: imageUrls[0] || null,
          images: imageUrls,
        })
        .select()
        .single();

      if (insertError) {
        throw new AppError(
          `Failed to create item: ${insertError.message}`,
          500,
        );
      }

      return res.status(201).json({
        success: true,
        message: "Item created successfully.",
        data: item,
      });
    } catch (error) {
      // Rollback uploaded images if something fails
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error("Image cleanup failed:", cleanupError.message);
        }
      }

      return next(error);
    }
  },
);

export const deleteItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Validate UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return next(new AppError("Invalid item ID.", 400));
    }

    // Find item
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("id, title, image_url, images")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return next(
        new AppError(`Failed to fetch item: ${fetchError.message}`, 500),
      );
    }

    if (!item) {
      return next(new AppError("Item not found.", 404));
    }

    // Extract storage paths from public URLs
    const imageUrls = [item.image_url, ...(item.images || [])].filter(Boolean);

    const storagePaths = [
      ...new Set(
        imageUrls
          .map((url: string) => {
            try {
              const pathname = new URL(url).pathname;

              const prefix = `/storage/v1/object/public/${BUCKET_NAME}/`;

              if (!pathname.startsWith(prefix)) {
                return null;
              }

              return decodeURIComponent(pathname.slice(prefix.length));
            } catch {
              return null;
            }
          })
          .filter((path): path is string => Boolean(path)),
      ),
    ];

    // Delete item from database first
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return next(
        new AppError(`Failed to delete item: ${deleteError.message}`, 500),
      );
    }

    // Delete associated images from Supabase Storage
    let storageWarning: string | null = null;

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(storagePaths);

      if (storageError) {
        console.error("Failed to delete item images:", storageError.message);

        storageWarning =
          "Item deleted successfully, but some images could not be removed from storage.";
      }
    }

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully.",
      data: {
        id: item.id,
        title: item.title,
        deletedImages: storagePaths.length,
      },
      ...(storageWarning && { warning: storageWarning }),
    });
  },
);

// Extract Supabase Storage paths from public URLs
const getStoragePath = (url: string): string | null => {
  try {
    const pathname = new URL(url).pathname;
    const prefix = `/storage/v1/object/public/${BUCKET_NAME}/`;

    if (!pathname.startsWith(prefix)) return null;

    return decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }
};

export const updateItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid item ID.",
    });
  }

  const { title, description, category, condition, status } = req.body;

  const files = (req.files || []) as Express.Multer.File[];

  // Find existing item
  const { data: existingItem, error: fetchError } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: "Item not found.",
    });
  }

  // Validate title
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Item title cannot be empty.",
    });
  }

  // Validate condition
  if (
    condition !== undefined &&
    !["new", "used", "refurbished"].includes(condition)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid item condition.",
    });
  }

  // Validate status
  if (
    status !== undefined &&
    !["draft", "published", "archived"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid item status.",
    });
  }

  // Prepare update data
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) {
    updateData.title = title.trim();
  }

  if (description !== undefined) {
    updateData.description = description.trim() || null;
  }

  if (category !== undefined) {
    updateData.category = category.trim() || null;
  }

  if (condition !== undefined) {
    updateData.condition = condition;
  }

  if (status !== undefined) {
    updateData.status = status;
  }

  const uploadedPaths: string[] = [];

  try {
    // Upload new images only if provided
    if (files.length > 0) {
      const newImageUrls: string[] = [];

      for (const file of files) {
        const extension = MIME_EXTENSIONS[file.mimetype];

        if (!extension) {
          throw new Error("Unsupported image format.");
        }

        const filePath = `${new Date().getFullYear()}/${randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        uploadedPaths.push(filePath);

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        newImageUrls.push(data.publicUrl);
      }

      // Replace old images with new images
      updateData.image_url = newImageUrls[0];
      updateData.images = newImageUrls;
    }

    // Update database
    const { data: updatedItem, error: updateError } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update item: ${updateError.message}`);
    }

    // Delete old images only after successful database update
    let storageWarning: string | null = null;

    if (files.length > 0) {
      const oldUrls = [
        existingItem.image_url,
        ...(existingItem.images || []),
      ].filter(Boolean);

      const oldPaths = [
        ...new Set(
          oldUrls
            .map((url: string) => getStoragePath(url))
            .filter((path): path is string => Boolean(path)),
        ),
      ];

      if (oldPaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(oldPaths);

        if (deleteError) {
          console.error("Old image cleanup failed:", deleteError.message);

          storageWarning =
            "Item updated, but some old images could not be deleted.";
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Item updated successfully.",
      data: updatedItem,
      ...(storageWarning && { warning: storageWarning }),
    });
  } catch (error) {
    // Rollback newly uploaded images if update fails
    if (uploadedPaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(uploadedPaths);

      if (cleanupError) {
        console.error("New image cleanup failed:", cleanupError.message);
      }
    }

    throw error;
  }
});

export const getAuctions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

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
            condition,
            status
          )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      results: auctions.length,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: {
        auctions,
      },
    });
  },
);

export const createAuction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      item_id,
      starting_bid = 1,
      currency = "ETB",
      starts_at,
      ends_at,
      participation_fee = 20,
    } = req.body;

    // Validate required fields
    if (!item_id || !starts_at || !ends_at) {
      return next(
        new AppError("Item, start date, and end date are required.", 400),
      );
    }

    // Validate item ID
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, title, status")
      .eq("id", item_id)
      .single();

    if (itemError || !item) {
      return next(new AppError("Item not found.", 404));
    }

    // Only published items can have auctions
    if (item.status !== "published") {
      return next(
        new AppError("Only published items can be used for auctions.", 400),
      );
    }

    // Validate dates
    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return next(new AppError("Invalid auction dates.", 400));
    }

    if (endDate <= startDate) {
      return next(
        new AppError("Auction end date must be after the start date.", 400),
      );
    }

    // Validate starting bid
    const startingBid = Number(starting_bid);

    if (!Number.isFinite(startingBid) || startingBid < 1) {
      return next(new AppError("Starting bid must be at least 1 ETB.", 400));
    }

    // Validate participation fee
    const participationFee = Number(participation_fee);

    if (!Number.isFinite(participationFee) || participationFee <= 0) {
      return next(
        new AppError("Participation fee must be greater than 0.", 400),
      );
    }

    // Validate currency
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
      return next(new AppError("Invalid currency code.", 400));
    }

    // Check if the item already has an active or scheduled auction
    const { data: existingAuction, error: existingError } = await supabase
      .from("auctions")
      .select("id, status")
      .eq("item_id", item_id)
      .in("status", ["scheduled", "live"])
      .maybeSingle();

    if (existingError) {
      return next(new AppError(existingError.message, 500));
    }

    if (existingAuction) {
      return next(
        new AppError(
          "This item already has an active or scheduled auction.",
          409,
        ),
      );
    }

    // Create auction
    const { data: auction, error } = await supabase
      .from("auctions")
      .insert({
        item_id,
        starting_bid: startingBid,
        currency,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        participation_fee: participationFee,
        created_by: req.user?.userId,
        status: startDate > new Date() ? "scheduled" : "live",
      })
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
          condition,
          status
        )
      `,
      )
      .single();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.status(201).json({
      status: "success",
      message: "Auction created successfully.",
      data: {
        auction,
      },
    });
  },
);
export const updateAuction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const {
      item_id,
      starting_bid,
      currency,
      starts_at,
      ends_at,
      participation_fee,
      status,
    } = req.body;

    // Check auction ID
    if (!id) {
      return next(new AppError("Auction ID is required.", 400));
    }

    // Get existing auction
    const { data: existingAuction, error: fetchError } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingAuction) {
      return next(new AppError("Auction not found.", 404));
    }

    // Prevent updating ended or cancelled auctions
    if (["ended", "cancelled"].includes(existingAuction.status)) {
      return next(
        new AppError("Ended or cancelled auctions cannot be updated.", 400),
      );
    }

    const updateData: Record<string, any> = {};

    // Validate item
    if (item_id !== undefined) {
      if (typeof item_id !== "string" || !item_id.trim()) {
        return next(new AppError("Invalid item ID.", 400));
      }

      const { data: item, error: itemError } = await supabase
        .from("items")
        .select("id, title, status")
        .eq("id", item_id)
        .single();

      if (itemError || !item) {
        return next(new AppError("Item not found.", 404));
      }

      if (item.status !== "published") {
        return next(
          new AppError("Only published items can be used for auctions.", 400),
        );
      }

      updateData.item_id = item_id;
    }

    // Validate starting bid
    if (starting_bid !== undefined) {
      const amount = Number(starting_bid);

      if (!Number.isFinite(amount) || amount < 1) {
        return next(new AppError("Starting bid must be at least 1 ETB.", 400));
      }

      updateData.starting_bid = amount;
    }

    // Validate participation fee
    if (participation_fee !== undefined) {
      const fee = Number(participation_fee);

      if (!Number.isFinite(fee) || fee <= 0) {
        return next(
          new AppError("Participation fee must be greater than 0.", 400),
        );
      }

      updateData.participation_fee = fee;
    }

    // Validate currency
    if (currency !== undefined) {
      if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
        return next(new AppError("Invalid currency code.", 400));
      }

      updateData.currency = currency;
    }

    // Validate start date
    if (starts_at !== undefined) {
      const date = new Date(starts_at);

      if (Number.isNaN(date.getTime())) {
        return next(new AppError("Invalid auction start date.", 400));
      }

      updateData.starts_at = date.toISOString();
    }

    // Validate end date
    if (ends_at !== undefined) {
      const date = new Date(ends_at);

      if (Number.isNaN(date.getTime())) {
        return next(new AppError("Invalid auction end date.", 400));
      }

      updateData.ends_at = date.toISOString();
    }

    // Validate auction dates together
    const finalStartDate = new Date(
      updateData.starts_at ?? existingAuction.starts_at,
    );

    const finalEndDate = new Date(
      updateData.ends_at ?? existingAuction.ends_at,
    );

    if (finalEndDate <= finalStartDate) {
      return next(
        new AppError("Auction end date must be after the start date.", 400),
      );
    }

    // Validate status
    if (status !== undefined) {
      const allowedStatuses = ["scheduled", "live", "cancelled"];

      if (!allowedStatuses.includes(status)) {
        return next(new AppError("Invalid auction status.", 400));
      }

      updateData.status = status;
    } else if (
      starts_at !== undefined &&
      existingAuction.status !== "cancelled"
    ) {
      // Automatically update status when dates change
      updateData.status = finalStartDate > new Date() ? "scheduled" : "live";
    }

    // Check for another active auction using the same item
    const finalItemId = updateData.item_id ?? existingAuction.item_id;

    if (finalItemId !== existingAuction.item_id) {
      const { data: conflictingAuction, error: conflictError } = await supabase
        .from("auctions")
        .select("id")
        .eq("item_id", finalItemId)
        .in("status", ["scheduled", "live"])
        .neq("id", id)
        .maybeSingle();

      if (conflictError) {
        return next(new AppError(conflictError.message, 500));
      }

      if (conflictingAuction) {
        return next(
          new AppError(
            "This item already has an active or scheduled auction.",
            409,
          ),
        );
      }
    }

    // Check whether there are fields to update
    if (Object.keys(updateData).length === 0) {
      return next(
        new AppError("Please provide at least one field to update.", 400),
      );
    }

    updateData.updated_at = new Date().toISOString();

    // Update auction
    const { data: auction, error: updateError } = await supabase
      .from("auctions")
      .update(updateData)
      .eq("id", id)
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
          condition,
          status
        )
      `,
      )
      .single();

    if (updateError) {
      return next(new AppError(updateError.message, 500));
    }

    res.status(200).json({
      status: "success",
      message: "Auction updated successfully.",
      data: {
        auction,
      },
    });
  },
);

export const getAuctionBids = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination
    const page = Math.max(
      1,
      Number.parseInt(String(req.query.page || "1"), 10) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(String(req.query.limit || "10"), 10) || 10),
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Search by item name
    const search = String(req.query.search || "").trim();

    let auctionIds: string[] | null = null;

    // Step 1: Find items matching the search
    if (search) {
      const { data: items, error: itemError } = await supabase
        .from("items")
        .select("id")
        .ilike("title", `%${search}%`);

      if (itemError) {
        return next(
          new AppError(`Failed to search items: ${itemError.message}`, 500),
        );
      }

      const itemIds = (items || []).map((item) => item.id);

      if (itemIds.length === 0) {
        return res.status(200).json({
          status: "success",
          results: 0,
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
          data: [],
        });
      }

      // Step 2: Find auctions belonging to those items
      const { data: auctions, error: auctionError } = await supabase
        .from("auctions")
        .select("id")
        .in("item_id", itemIds);

      if (auctionError) {
        return next(
          new AppError(
            `Failed to search auctions: ${auctionError.message}`,
            500,
          ),
        );
      }

      auctionIds = (auctions || []).map((auction) => auction.id);

      if (auctionIds.length === 0) {
        return res.status(200).json({
          status: "success",
          results: 0,
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
          data: [],
        });
      }
    }

    // Step 3: Fetch bids with all related information
    let query = supabase.from("auction_bids").select(
      `
          *,
          user:users!auction_bids_user_id_fkey (
            *
          ),
          auction:auctions!auction_bids_auction_id_fkey (
            *,
            item:items!auctions_item_id_fkey (
              *
            )
          ),
          payment_order:payment_orders!auction_bids_payment_order_id_fkey (
            *,
            payment_method:payment_methods!payment_orders_payment_method_id_fkey (
              *
            )
          ),
          ticket:tickets!auction_bids_ticket_id_fkey (
            *
          ),
          bid_transactions!bid_transactions_bid_id_fkey (
            *
          )
        `,
      { count: "exact" },
    );

    // Apply item-name search
    if (auctionIds !== null) {
      query = query.in("auction_id", auctionIds);
    }

    // Sorting and pagination
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return next(
        new AppError(`Failed to fetch auction bids: ${error.message}`, 500),
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      results: data?.length || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      data: data || [],
    });
  },
);

export const getPaymentOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Pagination
    const page = Math.max(
      1,
      Number.parseInt(String(req.query.page || "1"), 10) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(String(req.query.limit || "10"), 10) || 10),
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 2. Filters
    const telegramId = String(req.query.telegram_id || "").trim();
    const auctionId = String(req.query.auction_id || "").trim();
    const status = String(req.query.status || "").trim();

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 3. Validate Telegram ID
    if (telegramId && !/^\d+$/.test(telegramId)) {
      return next(
        new AppError("Invalid Telegram ID. It must contain only numbers.", 400),
      );
    }

    // 4. Validate auction ID
    if (auctionId && !uuidRegex.test(auctionId)) {
      return next(new AppError("Invalid auction ID.", 400));
    }

    // 5. Validate payment status
    const allowedStatuses = ["paid", "awaiting_payment"];

    if (status && !allowedStatuses.includes(status)) {
      return next(new AppError("Invalid payment status.", 400));
    }

    // 6. Find user using Telegram ID
    let userId: string | null = null;
    let searchedUser = null;

    if (telegramId) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, telegram_id, username, Fname, Lname, phone")
        .eq("telegram_id", telegramId)
        .maybeSingle();

      if (userError) {
        return next(
          new AppError(`Failed to search user: ${userError.message}`, 500),
        );
      }

      // No matching Telegram account
      if (!user) {
        return res.status(200).json({
          status: "success",
          results: 0,

          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },

          filters: {
            telegram_id: telegramId,
            auction_id: auctionId || null,
            status: status || null,
          },

          user: null,

          analytics: {
            total_orders: 0,
            paid_orders: 0,
            pending_orders: 0,
            success_rate: 0,
            average_payment: 0,
            currency_breakdown: [],
            payment_methods: [],
          },

          data: [],
        });
      }

      userId = user.id;
      searchedUser = user;
    }

    // 7. Fetch analytics
    const { data: analytics, error: analyticsError } = await supabase.rpc(
      "get_payment_order_analytics",
      {
        p_user_id: userId,
        p_auction_id: auctionId || null,
        p_status: status || null,
      },
    );

    if (analyticsError) {
      return next(
        new AppError(
          `Failed to fetch payment analytics: ${analyticsError.message}`,
          500,
        ),
      );
    }

    // 8. Fetch payment orders with all relationships
    let query = supabase.from("payment_orders").select(
      `
          *,
          user:users!payment_orders_user_id_fkey (
            *
          ),
          auction:auctions!payment_orders_auction_id_fkey (
            *,
            item:items!auctions_item_id_fkey (
              *
            )
          ),
          payment_method:payment_methods!payment_orders_payment_method_id_fkey (
            *
          )
        `,
      { count: "exact" },
    );

    // Filter using internal user UUID obtained from Telegram ID
    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (auctionId) {
      query = query.eq("auction_id", auctionId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // 9. Execute paginated query
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return next(
        new AppError(`Failed to fetch payment orders: ${error.message}`, 500),
      );
    }

    // 10. Pagination calculations
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 11. Response
    res.status(200).json({
      status: "success",

      results: data?.length || 0,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      filters: {
        telegram_id: telegramId || null,
        auction_id: auctionId || null,
        status: status || null,
      },

      user: searchedUser,

      analytics: analytics || {
        total_orders: 0,
        paid_orders: 0,
        pending_orders: 0,
        success_rate: 0,
        average_payment: 0,
        currency_breakdown: [],
        payment_methods: [],
      },

      data: data || [],
    });
  },
);

export const getAuctionSettlements = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { data, error } = await supabase
      .from("auction_settlements")
      .select(
        `
        *,
        winner:users!auction_settlements_winner_user_id_fkey (
          id,
          telegram_id,
          username,
          Fname,
          Lname,
          phone,
          created_at
        ),
        winning_bid:auction_bids!auction_settlements_winning_bid_id_fkey (
          *
        ),
        auction:auctions!auction_settlements_auction_id_fkey (
          id,
          status,
          starting_bid,
          participation_fee,
          currency,
          starts_at,
          ends_at,
          total_bids,
          total_revenue,
          item:items!auctions_item_id_fkey (
            id,
            title,
            slug,
            description,
            image_url,
            images,
            category,
            condition
          )
        )
      `,
      )
      .order("settled_at", { ascending: false });

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.status(200).json({
      status: "success",
      results: data.length,
      data: {
        settlements: data,
      },
    });
  },
);

export const getAdminOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Fetch all dashboard data in parallel
    const [
      usersCount,
      itemsCount,
      auctionsCount,
      liveAuctionsCount,
      scheduledAuctionsCount,
      endedAuctionsCount,
      cancelledAuctionsCount,
      bidsCount,
      paymentsCount,
      pendingPaymentsCount,
      paidPaymentsCount,
      winnersCount,
      settlementsCount,
      revenueData,
      recentUsers,
      recentAuctions,
      recentBids,
      recentPayments,
      recentWinners,
      recentSettlements,
    ] = await Promise.all([
      // Statistics
      supabase.from("users").select("*", { count: "exact", head: true }),

      supabase.from("items").select("*", { count: "exact", head: true }),

      supabase.from("auctions").select("*", { count: "exact", head: true }),

      supabase
        .from("auctions")
        .select("*", { count: "exact", head: true })
        .eq("status", "live"),

      supabase
        .from("auctions")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled"),

      supabase
        .from("auctions")
        .select("*", { count: "exact", head: true })
        .eq("status", "ended"),

      supabase
        .from("auctions")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled"),

      supabase.from("auction_bids").select("*", { count: "exact", head: true }),

      supabase
        .from("payment_orders")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("payment_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "awaiting_payment"),

      supabase
        .from("payment_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "paid"),

      supabase
        .from("auction_winners")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("auction_settlements")
        .select("*", { count: "exact", head: true }),

      // Revenue across all auctions
      supabase.from("auctions").select("total_revenue"),

      // Recent users
      supabase
        .from("users")
        .select(
          `
          id,
          telegram_id,
          username,
          Fname,
          Lname,
          phone,
          referral_id,
          created_at
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent auctions with items
      supabase
        .from("auctions")
        .select(
          `
          *,
          item:items!auctions_item_id_fkey (
            id,
            title,
            slug,
            description,
            image_url,
            images,
            category,
            condition
          ),
          creator:users!auctions_created_by_fkey (
            id,
            username,
            Fname,
            Lname
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent bids with users and auction items
      supabase
        .from("auction_bids")
        .select(
          `
          *,
          user:users!auction_bids_user_id_fkey (
            id,
            telegram_id,
            username,
            Fname,
            Lname,
            phone
          ),
          auction:auctions!auction_bids_auction_id_fkey (
            id,
            status,
            currency,
            starts_at,
            ends_at,
            item:items!auctions_item_id_fkey (
              id,
              title,
              image_url,
              images
            )
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent payments with users and auction items
      supabase
        .from("payment_orders")
        .select(
          `
          *,
          user:users!payment_orders_user_id_fkey (
            id,
            telegram_id,
            username,
            Fname,
            Lname,
            phone
          ),
          auction:auctions!payment_orders_auction_id_fkey (
            id,
            status,
            currency,
            item:items!auctions_item_id_fkey (
              id,
              title,
              image_url,
              images
            )
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent winners with winning bids, users and items
      supabase
        .from("auction_winners")
        .select(
          `
          *,
          user:users!auction_winners_user_id_fkey (
            id,
            telegram_id,
            username,
            Fname,
            Lname,
            phone
          ),
          winning_bid:auction_bids!auction_winners_winning_bid_id_fkey (
            id,
            bid_amount,
            paid_at,
            created_at
          ),
          auction:auctions!auction_winners_auction_id_fkey (
            id,
            status,
            currency,
            item:items!auctions_item_id_fkey (
              id,
              title,
              image_url,
              images,
              category
            )
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent settlements with winner, winning bid and item
      supabase
        .from("auction_settlements")
        .select(
          `
          *,
          winner:users!auction_settlements_winner_user_id_fkey (
            id,
            telegram_id,
            username,
            Fname,
            Lname,
            phone
          ),
          winning_bid:auction_bids!auction_settlements_winning_bid_id_fkey (
            id,
            bid_amount,
            paid_at,
            created_at
          ),
          auction:auctions!auction_settlements_auction_id_fkey (
            id,
            status,
            currency,
            total_bids,
            total_revenue,
            item:items!auctions_item_id_fkey (
              id,
              title,
              image_url,
              images,
              category,
              condition
            )
          ),
          admin:users!auction_settlements_decided_by_fkey (
            id,
            username,
            Fname,
            Lname
          )
        `,
        )
        .order("settled_at", { ascending: false })
        .limit(10),
    ]);

    // Check for database errors
    const results = [
      usersCount,
      itemsCount,
      auctionsCount,
      liveAuctionsCount,
      scheduledAuctionsCount,
      endedAuctionsCount,
      cancelledAuctionsCount,
      bidsCount,
      paymentsCount,
      pendingPaymentsCount,
      paidPaymentsCount,
      winnersCount,
      settlementsCount,
      revenueData,
      recentUsers,
      recentAuctions,
      recentBids,
      recentPayments,
      recentWinners,
      recentSettlements,
    ];

    const failedQuery = results.find((result) => result.error);

    if (failedQuery?.error) {
      return next(new AppError(failedQuery.error.message, 500));
    }

    // Calculate total revenue
    const totalRevenue = (revenueData.data ?? []).reduce(
      (total, auction) => total + Number(auction.total_revenue || 0),
      0,
    );

    // Response
    res.status(200).json({
      status: "success",

      data: {
        statistics: {
          users: {
            total: usersCount.count ?? 0,
          },

          items: {
            total: itemsCount.count ?? 0,
          },

          auctions: {
            total: auctionsCount.count ?? 0,
            live: liveAuctionsCount.count ?? 0,
            scheduled: scheduledAuctionsCount.count ?? 0,
            ended: endedAuctionsCount.count ?? 0,
            cancelled: cancelledAuctionsCount.count ?? 0,
          },

          bids: {
            total: bidsCount.count ?? 0,
          },

          payments: {
            total: paymentsCount.count ?? 0,
            pending: pendingPaymentsCount.count ?? 0,
            paid: paidPaymentsCount.count ?? 0,
          },

          winners: {
            total: winnersCount.count ?? 0,
          },

          settlements: {
            total: settlementsCount.count ?? 0,
          },

          revenue: {
            total: totalRevenue,
            currency: "ETB",
          },
        },

        recent: {
          users: recentUsers.data ?? [],
          auctions: recentAuctions.data ?? [],
          bids: recentBids.data ?? [],
          payments: recentPayments.data ?? [],
          winners: recentWinners.data ?? [],
          settlements: recentSettlements.data ?? [],
        },
      },
    });
  },
);
