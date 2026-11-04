import apiClient from "@/api/apiClient";
type GetAuctionItemsParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
};
type GetAuctionItemParam = {
  id?: string;
};

export const getAuctionItems = async (params: GetAuctionItemsParams = {}) => {
  const response = await apiClient.get("/auction/items/live", { params });
  return response.data;
};
export const getAuctionItem = async (params: GetAuctionItemParam = {}) => {
  const response = await apiClient.get(`/auction/item/${params.id}`);
  return response.data;
};

export type GetEndedAuctionsParams = {
  page?: number;
  limit?: number;
};

export const getEndedAuctions = async (params: GetEndedAuctionsParams = {}) => {
  const response = await apiClient.get("/auction/ended", {
    params,
  });

  return response.data;
};
