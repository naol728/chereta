import apiClient from "@/api/apiClient";

export type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";

export type ItemCondition = "new" | "used" | "refurbished";

export type ItemStatus = "draft" | "published" | "archived";

export interface AuctionItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  category: string | null;
  condition: ItemCondition;
  status: ItemStatus;
}

export interface Auction {
  id: string;
  item_id: string;
  starting_bid: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  status: AuctionStatus;
  total_bids: number;
  total_revenue: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participation_fee: number;
  item: AuctionItem;
}

export interface AuctionPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetAuctionsResponse {
  status: "success";
  results: number;
  pagination: AuctionPagination;
  data: {
    auctions: Auction[];
  };
}

export interface GetAuctionsParams {
  page?: number;
  limit?: number;
}

export const checkIsAdmin = async () => {
  const res = await apiClient.get("/admin/auth");
  return res.data;
};
export interface GetItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: "draft" | "published" | "archived";
}

export const getItems = async (params?: GetItemsParams) => {
  const res = await apiClient.get("/admin/items", {
    params,
  });

  return res.data;
};

export const getAuctions = async (params: GetAuctionsParams = {}) => {
  const res = await apiClient.get<GetAuctionsResponse>("/admin/auctions", {
    params,
  });

  return res.data;
};
export const getAuctionBids = async ({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const { data } = await apiClient.get("/admin/auction-bids", {
    params: {
      page,
      limit,
      search,
    },
  });

  return data;
};
export const getPaymentOrders = async ({
  page = 1,
  limit = 10,
  user_id,
  auction_id,
  status,
}: {
  page?: number;
  limit?: number;
  user_id?: string;
  auction_id?: string;
  status?: string;
} = {}) => {
  const { data } = await apiClient.get("/admin/payment-orders", {
    params: {
      page,
      limit,
      user_id,
      auction_id,
      status,
    },
  });

  return data;
};
export interface CreateAuctionPayload {
  item_id: string;
  starting_bid?: number;
  currency?: string;
  starts_at: string;
  ends_at: string;
  participation_fee?: number;
}

export const createAuction = async (
  auction: CreateAuctionPayload,
): Promise<GetAuctionsResponse> => {
  const res = await apiClient.post<GetAuctionsResponse>(
    "/admin/auction",
    auction,
  );

  return res.data;
};
export type UpdateAuctionPayload = Partial<CreateAuctionPayload> & {
  status?: AuctionStatus;
};

export const updateAuction = async (
  id: string,
  auction: UpdateAuctionPayload,
) => {
  const res = await apiClient.patch(`/admin/auctions/${id}`, auction);

  return res.data;
};
export const getItem = async (id: string) => {
  const res = await apiClient.get(`/admin/items/${id}`);
  return res.data;
};

export const deleteItem = async (id: string) => {
  const res = await apiClient.delete(`/admin/item/${id}`);
  return res.data;
};

export const createItem = async (formData: FormData) => {
  const response = await apiClient.post("/admin/item", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
export const updateItem = async ({
  id,
  payload,
}: {
  id: string;
  payload: FormData;
}) => {
  const response = await apiClient.patch(`/admin/item/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getAuctionSettlements = async () => {
  const { data } = await apiClient.get("/admin/auction-settlements");
  return data.data.settlements;
};

export const getAdminOverview = async () => {
  const { data } = await apiClient.get("/admin/overview");

  return data.data;
};
