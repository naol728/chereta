import apiClient from "@/api/apiClient";

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
