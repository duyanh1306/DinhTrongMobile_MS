import { getPartLabel } from "../constants/partCodes";

/** Lấy partCode từ dịch vụ đã chọn (cấu hình Admin, không đoán từ tên) */
export const getPartCodesFromServices = (repairServices, selectedServiceIds) =>
  repairServices
    .filter((s) =>
      selectedServiceIds.some((id) => String(id) === String(s._id))
    )
    .map((s) => s.partCode)
    .filter(Boolean);

export const getRecipeForPhoneModel = (recipes, phoneModelId) =>
  recipes.find(
    (r) =>
      String(r.phoneModelId?._id || r.phoneModelId) === String(phoneModelId)
  );

/** Danh mục linh kiện được phép theo Recipe + partCode dịch vụ */
export const getAllowedTypeNames = (recipe, partCodes) => {
  if (!recipe?.requiredParts?.length || !partCodes?.length) return [];

  const names = [];
  recipe.requiredParts.forEach((part) => {
    if (!partCodes.includes(part.partCode)) return;
    (part.acceptedItemTypes || []).forEach((t) => {
      if (t.name) names.push(t.name);
    });
  });
  return names;
};

export const formatPartCodesDisplay = (partCodes) =>
  partCodes.map((c) => `${getPartLabel(c)} (${c})`).join(", ");
