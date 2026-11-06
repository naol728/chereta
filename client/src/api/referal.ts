import apiClient from "./apiClient";

export const gerMyReferalstat = async () => {
  const response = await apiClient.get("/ref/stat");
  return response.data;
};
