const nodemailer = require("nodemailer");
const Order = require("../models/Order"); 

// Hàm 1: Gửi email thông báo chung
const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tominhthanh75@gmail.com",
        pass: "twsexeefnogsvewu", 
      },
    });

    await transporter.sendMail({
      from: '"DinhTrongMobile Support" <tominhthanh75@gmail.com>',
      to: email,
      subject: subject,
      text: text,
    });
  } catch (error) {
    console.error(" Email not sent:", error);
  }
};

// Hàm 2: Gửi hóa đơn điện tử siêu chi tiết
const sendInvoiceEmail = async (orderEmail, orderData, customerName) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "tominhthanh75@gmail.com", 
                pass: "twsexeefnogsvewu", 
            },
        });

        const fullOrder = await Order.findById(orderData._id || orderData.id)
            .populate('items.selectedParts', 'name warrantyPeriod price')
            .populate('storeId', 'name address location phone');

        if (!fullOrder) throw new Error("Không tìm thấy đơn hàng trong DB để tạo hóa đơn");

        const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
        const currentDate = new Date();
        const dateString = `Ngày ${currentDate.getDate().toString().padStart(2, '0')} tháng ${(currentDate.getMonth() + 1).toString().padStart(2, '0')} năm ${currentDate.getFullYear()}`;

        let itemsHtml = '';
        fullOrder.items.forEach((item, index) => {
            let partsHtml = '';
            if (item.selectedParts && item.selectedParts.length > 0) {
                partsHtml = `
                    <div style="margin-top: 8px; font-size: 12px; color: #555; background: #f9f9f9; padding: 8px; border-radius: 4px; border-left: 3px solid #0056b3;">
                        <strong style="color: #333;">Chi tiết linh kiện lắp ráp:</strong>
                        <ul style="margin: 5px 0 0 0; padding-left: 20px; list-style-type: circle;">
                            ${item.selectedParts.map(part => `
                                <li style="margin-bottom: 3px;">
                                    ${part.name || 'Linh kiện'} - <strong>BH: ${part.warrantyPeriod || 0} tháng</strong>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }

            const itemSpecs = (item.capacity && item.colorName) ? `(${item.capacity} | ${item.colorName})` : '';

            itemsHtml += `
                <tr>
                    <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                    <td style="padding: 12px 8px; border: 1px solid #ddd;">
                        <div style="font-weight: bold; color: #222; font-size: 14px;">${item.name} ${itemSpecs}</div>
                        ${item.grade && item.grade !== 'Mới' ? `<div style="font-size: 12px; color: #d70018; margin-top: 2px;">* Tình trạng: ${item.grade}</div>` : ''}
                        ${partsHtml}
                    </td>
                    <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; color: #d70018; font-weight: bold;">
                        ${item.warrantyPeriod || 12}T
                    </td>
                    <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                    <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: right;">${formatMoney(item.price)}</td>
                    <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatMoney(item.price * item.quantity)}</td>
                </tr>
            `;
        });

        const addressStr = fullOrder.shippingInfo.deliveryMethod === 'home' 
            ? `${fullOrder.shippingInfo.address}, ${fullOrder.shippingInfo.ward}, ${fullOrder.shippingInfo.district}, ${fullOrder.shippingInfo.province}`
            : 'Nhận tại cửa hàng (Theo hệ thống)';

      
        const storeAddress = fullOrder.storeId?.address || fullOrder.storeId?.location || 'Chưa cập nhật địa chỉ';
        const storeName = fullOrder.storeId?.name || 'DINH TRONG MOBILE';

        const mailOptions = {
            from: '"Dinh Trong Mobile" <tominhthanh75@gmail.com>',
            to: orderEmail,
            subject: `[DinhTrongMobile] Hóa đơn bán hàng & Phiếu bảo hành - Đơn #${fullOrder.orderCode}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #ccc; background-color: #fff; padding: 0;">
                
                <div style="padding: 30px; border-bottom: 2px dashed #ccc;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td width="55%" style="vertical-align: top;">
                                <h1 style="color: #d70018; margin: 0 0 10px 0; font-size: 26px; text-transform: uppercase;">${storeName}</h1>
                                <p style="margin: 3px 0; font-size: 13px; color: #444;"><strong>Địa chỉ:</strong> ${storeAddress}</p>
                                <p style="margin: 3px 0; font-size: 13px; color: #444;"><strong>Hotline:</strong> 0373972327</p>
                                <p style="margin: 3px 0; font-size: 13px; color: #444;"><strong>Email:</strong> tominhthanh75@gmail.com</p>
                            </td>
                            <td width="45%" style="vertical-align: top; text-align: right;">
                                <h2 style="margin: 0 0 5px 0; font-size: 20px; color: #333; text-transform: uppercase;">Hóa Đơn Bán Hàng</h2>
                                <p style="margin: 0; font-size: 13px; color: #666; font-style: italic;">(Kiêm phiếu bảo hành điện tử)</p>
                                <div style="margin-top: 15px; display: inline-block; background: #f4f4f4; padding: 10px 15px; border-radius: 5px; text-align: left;">
                                    <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>Mã đơn:</strong> <span style="color: #d70018;">#${fullOrder.orderCode}</span></p>
                                    <p style="margin: 0; font-size: 13px;"><strong>${dateString}</strong></p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="padding: 20px 30px;">
                    <h3 style="font-size: 15px; color: #333; border-left: 4px solid #d70018; padding-left: 10px; margin-bottom: 15px;">THÔNG TIN KHÁCH HÀNG</h3>
                    <table width="100%" cellpadding="5" cellspacing="0" border="0" style="font-size: 14px; color: #333;">
                        <tr>
                            <td width="120"><strong>Khách hàng:</strong></td>
                            <td>${customerName}</td>
                        </tr>
                        <tr>
                            <td><strong>Điện thoại:</strong></td>
                            <td>${fullOrder.shippingInfo.phone}</td>
                        </tr>
                        <tr>
                            <td><strong>Địa chỉ:</strong></td>
                            <td>${addressStr}</td>
                        </tr>
                        <tr>
                            <td><strong>Hình thức TT:</strong></td>
                            <td><span style="background: #e6f4ea; color: #1e8e3e; padding: 3px 8px; border-radius: 3px; font-weight: bold; font-size: 12px;">ĐÃ THANH TOÁN (${fullOrder.paymentMethod})</span></td>
                        </tr>
                    </table>
                </div>

                <div style="padding: 0 30px 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f1f1f1; text-align: center; font-weight: bold; color: #333;">
                                <td style="padding: 12px 8px; border: 1px solid #ddd;" width="5%">STT</td>
                                <td style="padding: 12px 8px; border: 1px solid #ddd;" width="45%">Tên Hàng Hóa / Dịch Vụ</td>
                                <td style="padding: 12px 8px; border: 1px solid #ddd;" width="10%">Bảo Hành</td>
                                <td style="padding: 12px 8px; border: 1px solid #ddd;" width="5%">SL</td>
                                <td style="padding: 12px 8px; border: 1px solid #ddd;" width="15%">Đơn Giá</td>
                                <td style="padding: 12px 8px; border: 1px solid #ddd;" width="20%">Thành Tiền</td>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <table width="100%" cellpadding="8" cellspacing="0" border="0" style="margin-top: 15px; font-size: 14px;">
                        <tr>
                            <td width="65%" style="text-align: right; color: #555;">Tổng tiền hàng:</td>
                            <td width="35%" style="text-align: right; font-weight: bold;">${formatMoney(fullOrder.totalAmount)}</td>
                        </tr>
                        <tr>
                            <td style="text-align: right; color: #555;">Phí vận chuyển:</td>
                            <td style="text-align: right; font-weight: bold;">0 đ</td>
                        </tr>
                        <tr>
                            <td style="text-align: right; font-size: 16px; font-weight: bold; text-transform: uppercase;">Tổng Cộng Thu:</td>
                            <td style="text-align: right; font-size: 20px; font-weight: bold; color: #d70018;">${formatMoney(fullOrder.totalAmount)}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee; font-size: 13px; color: #666; line-height: 1.6;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #d70018;">LƯU Ý BẢO HÀNH</p>
                    <p style="margin: 0;">- Email này có giá trị pháp lý tương đương Hóa đơn giấy & Phiếu bảo hành bản cứng.</p>
                    <p style="margin: 0;">- Quý khách vui lòng không cung cấp Hóa đơn này cho người lạ để tránh rủi ro.</p>
                    <p style="margin: 15px 0 0 0; font-style: italic;">Cảm ơn Quý khách đã tin tưởng và mua sắm tại ${storeName}!</p>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
      
        return false;
    }
};
const sendConfirmRequestEmail = async (customerEmail, orderData, customerName) => {
  try {
      const transporter = nodemailer.createTransport({
          service: "gmail", auth: { user: "tominhthanh75@gmail.com", pass: "twsexeefnogsvewu" }
      });

      const historyLink = `http://localhost:3000/order-history`;

      await transporter.sendMail({
          from: '"Dinh Trong Mobile" <tominhthanh75@gmail.com>',
          to: customerEmail,
          subject: `[DinhTrongMobile] Đơn hàng #${orderData.orderCode || orderData._id.toString().substring(18)} đã được giao thành công!`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #d70018;">Đơn hàng đã giao thành công!</h2>
              <p>Xin chào <strong>${customerName}</strong>,</p>
              <p>Theo thông tin từ đơn vị vận chuyển, đơn hàng của bạn đã được giao đến nơi.</p>
              <p>Vui lòng truy cập vào tài khoản của bạn trên Website và xác nhận đã nhận hàng.</p>
              <div style="text-align: center; margin: 25px 0;">
                  <a href="${historyLink}" style="background-color: #d70018; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">XÁC NHẬN ĐÃ NHẬN HÀNG</a>
              </div>
              <p style="color: #666; font-size: 13px;"><em>* Lưu ý: Nếu sau 3 ngày bạn không có phản hồi, hệ thống sẽ tự động chuyển đơn hàng sang trạng thái Đã hoàn thành. Nếu bạn chưa nhận được hàng, vui lòng bấm báo cáo trong Lịch sử đơn hàng.</em></p>
          </div>
          `
      });
      return true;
  } catch (error) { console.error("Lỗi gửi mail nhắc:", error); return false; }
};

// 2. Email báo động cho TẤT CẢ Sale của Cửa hàng khi khách bấm "Chưa nhận được hàng"
const sendIssueReportEmail = async (staffEmailsArray, orderData, customerName, customerPhone) => {
  try {
      const toEmails = staffEmailsArray.length > 0 ? staffEmailsArray.join(',') : "tominhthanh75@gmail.com";

      const transporter = nodemailer.createTransport({
          service: "gmail", auth: { user: "tominhthanh75@gmail.com", pass: "twsexeefnogsvewu" }
      });

      await transporter.sendMail({
          from: '"Hệ thống DTM Cảnh Báo" <tominhthanh75@gmail.com>',
          to: toEmails,
          subject: ` [KHẨN CẤP] Khách báo CHƯA NHẬN ĐƯỢC ĐƠN #${orderData.orderCode || orderData._id.toString().substring(18)}`,
          html: `
          <div style="font-family: Arial; padding: 20px; border: 2px solid red; border-radius: 8px;">
              <h2 style="color: red;">CẢNH BÁO: KHÁCH CHƯA NHẬN ĐƯỢC HÀNG</h2>
              <p>Hệ thống ghi nhận đơn vị vận chuyển đã giao đơn hàng này, nhưng khách hàng vừa phản hồi là <strong>CHƯA NHẬN ĐƯỢC HÀNG</strong>.</p>
              <ul>
                  <li><strong>Khách hàng:</strong> ${customerName}</li>
                  <li><strong>Số điện thoại:</strong> ${customerPhone}</li>
              </ul>
              <p><strong>Yêu cầu:</strong> Các bạn Sale của Cửa hàng vui lòng gọi điện ngay cho khách hàng và liên hệ với Bưu cục để xử lý sự cố này gấp!</p>
          </div>
          `
      });
      return true;
  } catch (error) {  return false; }
};
// 3. Email báo cho Manager B khi có người xin hàng
const sendTransferRequestCreatedEmail = async (managerEmailsArray, requestData, fromStoreName, toStoreName) => {
    try {
        const toEmails = managerEmailsArray.length > 0 ? managerEmailsArray.join(',') : "tominhthanh75@gmail.com";
        const transporter = nodemailer.createTransport({
            service: "gmail", auth: { user: "tominhthanh75@gmail.com", pass: "twsexeefnogsvewu" }
        });

        await transporter.sendMail({
            from: '"Hệ Thống Kho DTM" <tominhthanh75@gmail.com>',
            to: toEmails,
            subject: `[DinhTrongMobile] Yêu cầu cấp hàng mới từ ${toStoreName}`,
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #0056b3;">Có yêu cầu xin cấp hàng mới!</h2>
                <p>Chào Quản lý cửa hàng <strong>${fromStoreName}</strong>,</p>
                <p>Cửa hàng <strong>${toStoreName}</strong> vừa tạo một yêu cầu xin cấp luân chuyển Linh kiện / Điện thoại từ kho của bạn.</p>
                <p><strong>Mã phiếu:</strong> ${requestData._id}</p>
                <p><strong>Ghi chú:</strong> ${requestData.note || 'Không có ghi chú'}</p>
                <p>Vui lòng đăng nhập vào hệ thống quản lý, mục <strong>Duyệt Luân Chuyển</strong> để kiểm tra tồn kho và xác nhận phê duyệt (Approve) cho yêu cầu này.</p>
                <br/>
                <p style="color: #666; font-size: 13px;"><em>Đây là email tự động từ hệ thống DinhTrongMobile.</em></p>
            </div>
            `
        });
    
        return true;
    } catch (error) {  return false; }
};

// 4. Email báo cho Sale B khi Manager B duyệt, yêu cầu Sale xuất kho
const sendTransferRequestApprovedEmail = async (saleEmailsArray, requestData, fromStoreName, toStoreName) => {
    try {
        const toEmails = saleEmailsArray.length > 0 ? saleEmailsArray.join(',') : "tominhthanh75@gmail.com";
        const transporter = nodemailer.createTransport({
            service: "gmail", auth: { user: "tominhthanh75@gmail.com", pass: "twsexeefnogsvewu" }
        });

        await transporter.sendMail({
            from: '"Hệ Thống Kho DTM" <tominhthanh75@gmail.com>',
            to: toEmails,
            subject: `[DinhTrongMobile] Lệnh xuất kho luân chuyển đến ${toStoreName}`,
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #d70018;">Lệnh xuất hàng luân chuyển!</h2>
                <p>Chào bộ phận Sale cửa hàng <strong>${fromStoreName}</strong>,</p>
                <p>Quản lý vừa <strong>PHÊ DUYỆT</strong> phiếu xuất hàng luân chuyển tới cửa hàng <strong>${toStoreName}</strong>.</p>
                <p><strong>Mã phiếu:</strong> ${requestData._id}</p>
                <p><strong>Nhiệm vụ của bạn:</strong></p>
                <ol>
                    <li>Đăng nhập vào hệ thống bằng tài khoản Sale.</li>
                    <li>Vào mục <strong>Xuất Luân Chuyển</strong>.</li>
                    <li>Sử dụng máy quét mã vạch (hoặc nhập tay) đúng Serial các Linh kiện / Điện thoại để đóng gói.</li>
                    <li>Bấm xác nhận xuất kho để chuyển hàng cho Đơn vị vận chuyển.</li>
                </ol>
                <br/>
                <p style="color: #666; font-size: 13px;"><em>Vui lòng thực hiện sớm để cửa hàng ${toStoreName} kịp có hàng bán!</em></p>
            </div>
            `
        });
        return true;
    } catch (error) { return false; }
};
module.exports = { sendInvoiceEmail, sendEmail, sendConfirmRequestEmail, sendIssueReportEmail, sendTransferRequestCreatedEmail, sendTransferRequestApprovedEmail };

