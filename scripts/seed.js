
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
const College = require("../src/models/College");
const Review = require("../src/models/Review");

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from .env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const users = {};
  const demoUsers = [
    ["Seed Admin", "admin.seed@example.com", "SeedAdmin123!", "admin"],
    ["Seed Teacher", "teacher.seed@example.com", "SeedTeacher123!", "teacher"],
    ["Seed Student", "student.seed@example.com", "SeedStudent123!", "student"],
  ];

  for (const [name, email, plainPassword, role] of demoUsers) {
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(plainPassword, 12),
        role,
      });
    }

    users[role] = user;
  }

  const collegeData = [
    { name: "Seed Engineering College", city: "Chennai", state: "Tamil Nadu" },
    { name: "Seed Science College", city: "Coimbatore", state: "Tamil Nadu" },
  ];

  for (let i = 0; i < collegeData.length; i++) {
    const data = collegeData[i];

    let college = await College.findOne({
      name: data.name,
      city: data.city,
    });

    if (!college) {
      college = await College.create({
        ...data,
        description: "Demo college for assessment testing.",
        createdBy: users.admin._id,
      });
    }

    const review = await Review.findOne({
      college: college._id,
      student: users.student._id,
    });

    if (!review) {
      await Review.create({
        college: college._id,
        student: users.student._id,
        rating: i === 0 ? 5 : 4,
        comment: "Sample review created by the seed script.",
      });
    }
  }

  console.log("Seeding completed successfully.");
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
