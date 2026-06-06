import { Resend } from "resend";

let resendClient = null;

const configureResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend API key not provided - email features disabled");
    return null;
  }
  resendClient = new Resend(process.env.RESEND_API_KEY);
  console.log("Resend email client configured");
  return resendClient;
};

export const getResendClient = () => {
  if (!resendClient) {
    throw new Error("Resend client not initialized. Call configureResend() first.");
  }
  return resendClient;
};

export default configureResend;
