const PART_CODES = [
  { code: "MB", label: "Mainboard" },
  { code: "SCR", label: "Màn hình" },
  { code: "BAT", label: "Pin" },
  { code: "HSG", label: "Vỏ máy" },
  { code: "CAM-R", label: "Camera Sau" },
  { code: "CAM-F", label: "Camera Trước" },
  { code: "CPT", label: "Cụm chân sạc" },
  { code: "SPK", label: "Loa ngoài" },
  { code: "FGL", label: "Mặt kính" },
  { code: "BGL", label: "Kính lưng" },
  { code: "OTH", label: "Khác" },
];

const BASE_CODE_SET = new Set(PART_CODES.map((p) => p.code));

const parsePartCodeFromTypeCode = (code = "") => {
  if (!code) return null;
  const upper = String(code).toUpperCase().trim();
  const parts = upper.split("-");
  if (parts[0] === "CAM" && parts[1]) return `CAM-${parts[1]}`;
  if (BASE_CODE_SET.has(parts[0])) return parts[0];
  return null;
};

module.exports = { PART_CODES, BASE_CODE_SET, parsePartCodeFromTypeCode };
