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
            500
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
          500
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
  }
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
        new AppError(`Failed to fetch item: ${fetchError.message}`, 500)
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
          .filter((path): path is string => Boolean(path))
      ),
    ];

    // Delete item from database first
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return next(
        new AppError(`Failed to delete item: ${deleteError.message}`, 500)
      );
    }

    // Delete associated images from Supabase Storage
    let storageWarning: string | null = null;

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(storagePaths);

      if (storageError) {
        console.error(
          "Failed to delete item images:",
          storageError.message
        );

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
  }
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

export const updateItem = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID.",
      });
    }

    const {
      title,
      description,
      category,
      condition,
      status,
    } = req.body;

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
            throw new Error(
              `Image upload failed: ${uploadError.message}`
            );
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
        throw new Error(
          `Failed to update item: ${updateError.message}`
        );
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
              .filter((path): path is string => Boolean(path))
          ),
        ];

        if (oldPaths.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(oldPaths);

          if (deleteError) {
            console.error(
              "Old image cleanup failed:",
              deleteError.message
            );

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
          console.error(
            "New image cleanup failed:",
            cleanupError.message
          );
        }
      }

      throw error;
    }
  }
);
