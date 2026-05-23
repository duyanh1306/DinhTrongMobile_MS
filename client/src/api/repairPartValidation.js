import axiosClient from "./axiosClient";

export const validateRepairPartApi = async ({ phoneModelId, partCodes, serialCode }) => {
  const res = await axiosClient.post("/recipes/validate-item", {
    phoneModelId,
    partCodes,
    serialCode,
  });
  return res.data;
};
