import { getTwilioClient, getTwilioPhoneNumber } from "../config/twilio.js";

export const sendOTPSMS = async (to, otp) => {
  const client = getTwilioClient();
  const fromNumber = getTwilioPhoneNumber();

  try {
    const message = await client.messages.create({
      body: `Your Blog App verification code is: ${otp}. This code expires in 5 minutes.`,
      from: fromNumber,
      to,
    });

    return message.sid;
  } catch (error) {
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};
