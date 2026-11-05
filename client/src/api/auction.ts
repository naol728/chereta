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

export const createPaymentOrder = async (
  params: { id: string },
  bidAmount: number,
) => {
  const response = await apiClient.post(`/auction/${params.id}/payment-order`, {
    bid_amount: bidAmount,
  });

  return response.data;
};

export const getPendingPaymentOrder = async (params: { id: string }) => {
  const response = await apiClient.get(
    `/auction/${params.id}/my-pending-payment-order`,
  );

  return response.data;
};
export const submitPaymentTransaction = async (params: {
  id: string;
  transaction_reference: string;
}) => {
  const response = await apiClient.post(
    `/auction/${params.id}/submitpaymenttrxid`,
    {
      transaction_reference: params.transaction_reference,
    },
  );

  return response.data;
};
export const deletePaymentOrder = async (params: { id: string }) => {
  const response = await apiClient.delete(
    `/auction/${params.id}/payment-order`,
  );

  return response.data;
};
export const getMyAuction = async () => {
  const response = await apiClient.get("/auction/my-bids");
  return response.data;
};

export const getPreviousAuctions = async (params?: {
  limit?: number;
  page?: number;
}) => {
  const response = await apiClient.get("/auction/previous", {
    params,
  });

  return response.data;
};
