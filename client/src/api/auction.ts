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
  const response = await apiClient.get("/auction/items", { params });
  return response.data;
};
export const getAuctionItem = async (params: GetAuctionItemParam = {}) => {
  const response = await apiClient.get(`/auction/item/${params.id}`);
  return response.data;
};
