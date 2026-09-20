import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  message: string
) {
  try {
    await transporter.sendMail({
      from: `"MentorLink" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
    });

    console.log(`Email sent successfully to ${to}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Email sending failed:", error);

    return {
      success: false,
    };
  }
}