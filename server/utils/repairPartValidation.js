const Recipe = require("../models/Recipe");
const { parsePartCodeFromTypeCode } = require("../constants/partCodes");

const collectAllowedTypes = (recipe, partCodes) => {
  const ids = new Set();
  const names = new Set();

  if (!recipe?.requiredParts?.length) return { ids, names };

  recipe.requiredParts.forEach((part) => {
    if (!partCodes.includes(part.partCode)) return;
    (part.acceptedItemTypes || []).forEach((t) => {
      if (t._id || t) ids.add(String(t._id || t));
      if (t.name) names.add(t.name.toLowerCase().trim());
    });
  });

  return { ids, names };
};

const validateItemAgainstRecipe = (item, recipe, partCodes) => {
  if (!item) {
    return { ok: false, reason: "Không tìm thấy linh kiện" };
  }
  if (!partCodes?.length) {
    return {
      ok: false,
      reason: 'Dịch vụ chưa gán "Nhóm linh kiện" (BAT, SCR...). Vào Admin → Dịch vụ sửa chữa.',
    };
  }
  if (!recipe) {
    return {
      ok: false,
      reason: "Chưa có Recipe cho mẫu máy này. Vào Admin → Cấu hình máy dựng.",
    };
  }

  const serial = (item.serialCode || "").toUpperCase();
  const itemPartCode = parsePartCodeFromTypeCode(item.item_type?.code || serial);

  if (!itemPartCode || !partCodes.includes(itemPartCode)) {
    return {
      ok: false,
      reason: `Linh kiện nhóm ${itemPartCode || "?"} — cần ${partCodes.join(", ")}`,
      itemPartCode,
    };
  }

  if (serial && !partCodes.some((pc) => serial.startsWith(`${pc}-`))) {
    return {
      ok: false,
      reason: `Mã serial phải bắt đầu bằng ${partCodes.join(" hoặc ")}-`,
      itemPartCode,
    };
  }

  const { ids, names } = collectAllowedTypes(recipe, partCodes);
  if (ids.size === 0 && names.size === 0) {
    return {
      ok: false,
      reason: "Recipe chưa tick danh mục linh kiện cho nhóm dịch vụ đã chọn",
      itemPartCode,
    };
  }

  const typeId = String(item.item_type?._id || item.item_type || "");
  const typeName = (item.item_type?.name || "").toLowerCase().trim();

  if ((typeId && typeId !== "undefined" && ids.has(typeId)) || (typeName && names.has(typeName))) {
    return { ok: true, itemPartCode };
  }

  return {
    ok: false,
    reason: "Linh kiện không nằm trong danh mục Recipe đã cấu hình cho máy + dịch vụ này",
    itemPartCode,
  };
};

const validateRepairItemForModel = async (item, phoneModelId, partCodes) => {
  const recipe = await Recipe.findOne({ phoneModelId }).populate(
    "requiredParts.acceptedItemTypes",
    "name code"
  );
  return validateItemAgainstRecipe(item, recipe, partCodes);
};

module.exports = {
  collectAllowedTypes,
  validateItemAgainstRecipe,
  validateRepairItemForModel,
};
