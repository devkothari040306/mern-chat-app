import nodemailer from "nodemailer";

const requiredEmailEnv = ["GMAIL_USER", "GMAIL_APP_PASSWORD"];

export const isMailerConfigured = () => {
  return requiredEmailEnv.every((key) => Boolean(process.env[key]));
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
    },
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  if (!isMailerConfigured()) {
    throw new Error("Gmail password recovery is not configured");
  }

  const transporter = createTransporter();
  const from = process.env.MAIL_FROM || process.env.GMAIL_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your Chat App password",
    text: [
      "We received a request to reset your Chat App password.",
      "",
      `Open this link to choose a new password: ${resetUrl}`,
      "",
      "This link expires in 15 minutes. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #172033;">
        <h2>Reset your Chat App password</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 16px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">
            Choose a new password
          </a>
        </p>
        <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};
