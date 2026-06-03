import twilio from "twilio";

let twilioClient = null;

const configureTwilio = () => {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log("Twilio SMS client configured");
  return twilioClient;
};

export const getTwilioClient = () => {
  if (!twilioClient) {
    throw new Error("Twilio client not initialized. Call configureTwilio() first.");
  }
  return twilioClient;
};

export const getTwilioPhoneNumber = () => process.env.TWILIO_PHONE_NUMBER;

export default configureTwilio;
