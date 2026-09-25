import nodemailer from "nodemailer";

type TaskEmailData = {
  to: string;
  studentName: string;
  senderName: string;
  senderRole: "mentor" | "teacher";
  taskType: string;
  title: string;
  description: string;
  dueDate?: string | Date | null;
};

export async function sendTaskEmail({
  to,
  studentName,
  senderName,
  senderRole,
  taskType,
  title,
  description,
  dueDate,
}: TaskEmailData) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleString("en-IN")
    : "No due date";

  await transporter.sendMail({
    from: `"MentorLink" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New ${taskType} - ${title}`,
    text: `Hello ${studentName},

You have received a new ${taskType} on MentorLink.

Task Title: ${title}

Description:
${description}

Given By: ${senderName} (${senderRole})

Due Date: ${formattedDueDate}

Please login to your MentorLink account to view and complete the task.

Regards,
MentorLink Team`,
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MentorLink" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
}
