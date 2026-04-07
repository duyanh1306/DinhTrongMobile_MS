export const formatCurrency = (val) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);
};

export const formatCompact = (val) => {
  if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' Tỷ';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Tr';
  if (val >= 1000) return (val / 1000).toFixed(1) + ' K';
  return val;
};

export const docSoThanhChu = (so) => {
  if (!so || so === 0) return "Không đồng";
  const chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const hang = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let str = so.toString();
  let result = "";
  let hangCount = 0;

  while (str.length > 0) {
    let chunk = str.slice(-3);
    str = str.slice(0, -3);
    if (parseInt(chunk) !== 0) {
      let chunkStr = "";
      for (let i = 0; i < chunk.length; i++) {
        let digit = parseInt(chunk[chunk.length - 1 - i]);
        if (i === 0) chunkStr = chuSo[digit] + " " + chunkStr;
        if (i === 1) chunkStr = chuSo[digit] + " mươi " + chunkStr;
        if (i === 2) chunkStr = chuSo[digit] + " trăm " + chunkStr;
      }
      chunkStr = chunkStr.replace("không mươi", "lẻ");
      chunkStr = chunkStr.replace("một mươi", "mười");
      chunkStr = chunkStr.replace("mươi năm", "mươi lăm");
      chunkStr = chunkStr.replace("mười năm", "mười lăm");
      chunkStr = chunkStr.replace("mươi một", "mươi mốt");
      
      result = chunkStr.trim() + " " + hang[hangCount] + " " + result;
    }
    hangCount++;
  }
  
  result = result.replace(/không trăm lẻ không/g, "");
  result = result.replace(/không trăm lẻ/g, "lẻ");
  result = result.trim() + " đồng";
  return result.charAt(0).toUpperCase() + result.slice(1);
};