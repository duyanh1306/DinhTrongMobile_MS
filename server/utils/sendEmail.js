const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Hoặc cấu hình SMTP khác nếu bạn có
      auth: {
        user: "tominhthanh75@gmail.com",
        pass: "twsexeefnogsvewu", 
      },
    });

    await transporter.sendMail({
      from: "DinhTrongMobile Support <no-reply@dinhtrongmobile.com>",
      to: email,
      subject: subject,
      text: text,
    });

    console.log("✅ Email sent successfully to " + email);
  } catch (error) {
    console.error("❌ Email not sent:", error);
    throw error; // Ném lỗi để controller bắt được
  }
};

module.exports = sendEmail;