import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ROLES } from "./constants.js";

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.log("No ADMIN_EMAIL in env, skipping admin seed");
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    await User.create({
      name: process.env.ADMIN_NAME || "Super Admin",
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || "",
      password: hashedPassword,
      role: ROLES.ADMIN,
      isVerified: true,
      isApproved: true,
    });

    console.log(`Admin account seeded: ${adminEmail}`);
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

export default seedAdmin;
