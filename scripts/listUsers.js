require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find({})
      .select("name email role")
      .lean();

    console.table(users);
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
