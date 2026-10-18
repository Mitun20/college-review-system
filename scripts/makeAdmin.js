
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.argv[2]?.trim().toLowerCase();

    if (!email) {
      throw new Error(
        "Usage: node scripts/makeAdmin.js your-email@example.com"
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found. Check the registered email.");
    }

    user.role = "admin";
    await user.save();

    console.log(`Admin role assigned to: ${user.email}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
