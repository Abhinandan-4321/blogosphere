import nodemailer from "nodemailer";

const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is not set in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const getFromEmail = () => `"Blogosphere" <${process.env.GMAIL_USER}>`;

export const sendOTPEmail = async (to, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: getFromEmail(),
    to,
    subject: "Your Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verification Code</h2>
        <p>Your OTP verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendNewPostNotification = async (to, authorName, postTitle, postSlug) => {
  const transporter = createTransporter();

  const postUrl = `${process.env.CLIENT_URL}/blog/${postSlug}`;

  try {
    await transporter.sendMail({
      from: getFromEmail(),
      to,
      subject: `${authorName} published a new post: ${postTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Post from ${authorName}</h2>
          <p><strong>${authorName}</strong> just published a new article:</p>
          <h3>${postTitle}</h3>
          <a href="${postUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Read Now
          </a>
          <p style="margin-top: 20px; color: #666;">You're receiving this because you follow ${authorName}.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error(`Failed to send notification email to ${to}:`, error.message);
    return null;
  }
};

export const sendPasswordResetEmail = async (to, resetToken) => {
  const transporter = createTransporter();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: getFromEmail(),
    to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Reset Password
        </a>
        <p style="margin-top: 20px;">This link will expire in <strong>1 hour</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendApprovalEmail = async (to, name) => {
  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: getFromEmail(),
      to,
      subject: "Your Account Has Been Approved!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Your account has been approved by the admin. You can now log in and start using the platform.</p>
          <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Log In Now
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error(`Failed to send approval email to ${to}:`, error.message);
    return null;
  }
};
