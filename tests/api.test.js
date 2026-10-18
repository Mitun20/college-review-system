jest.setTimeout(30000);
process.env.JWT_SECRET = "test-secret-for-integration-tests";

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");
const User = require("../src/models/User");
const College = require("../src/models/College");
const Review = require("../src/models/Review");

let mongoServer;
let student;
let otherStudent;
let admin;
let college;
let studentToken;
let otherStudentToken;
let adminToken;

function tokenFor(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

beforeAll(async () => {
  console.log("STEP 1: Starting in-memory MongoDB");

  mongoServer = await MongoMemoryServer.create();

  console.log("STEP 2: MongoDB started:", mongoServer.getUri());
  console.log("STEP 3: Connecting Mongoose");

  await mongoose.connect(mongoServer.getUri(), {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("STEP 4: Mongoose connected");
}, 15000);

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    College.deleteMany({}),
    Review.deleteMany({}),
  ]);

  const password = await bcrypt.hash("Password123", 4);

  [student, otherStudent, admin] = await User.create([
    {
      name: "Test Student",
      email: "student@test.com",
      password,
      role: "student",
    },
    {
      name: "Other Student",
      email: "other@test.com",
      password,
      role: "student",
    },
    {
      name: "Test Admin",
      email: "admin@test.com",
      password,
      role: "admin",
    },
  ]);

  college = await College.create({
    name: "Test College",
    city: "Chennai",
    state: "Tamil Nadu",
  });

  studentToken = tokenFor(student);
  otherStudentToken = tokenFor(otherStudent);
  adminToken = tokenFor(admin);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Authentication integration tests", () => {
  test("registers a student", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "New Student",
        email: "newstudent@test.com",
        password: "Password123",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("student");
    expect(response.body.user.email).toBe("newstudent@test.com");
    expect(response.body.user.password).toBeUndefined();
  });

  test("logs in with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "student@test.com",
        password: "Password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test("rejects invalid login credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "student@test.com",
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);
  });
});

describe("Review CRUD integration tests", () => {
  test("rejects unauthenticated review requests", async () => {
    const response = await request(app).get("/api/reviews");

    expect(response.status).toBe(401);
  });

  test("creates, lists, retrieves, updates and deletes a review", async () => {
    const created = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        college: college._id.toString(),
        rating: 4,
        comment: "Good college",
      });

    expect(created.status).toBe(201);

    const reviewId = created.body.review._id;

    const listed = await request(app)
      .get("/api/reviews?page=1&limit=10")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(listed.status).toBe(200);
    expect(listed.body.total).toBe(1);

    const retrieved = await request(app)
      .get(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(retrieved.status).toBe(200);
    expect(retrieved.body.review.rating).toBe(4);

    const updated = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ rating: 5, comment: "Excellent college" });

    expect(updated.status).toBe(200);
    expect(updated.body.review.rating).toBe(5);

    const deleted = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(deleted.status).toBe(200);

    const missing = await request(app)
      .get(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(missing.status).toBe(404);
  });

  test("prevents students from modifying another student's review", async () => {
    const review = await Review.create({
      college: college._id,
      student: student._id,
      rating: 3,
      comment: "Average college",
    });

    const response = await request(app)
      .put(`/api/reviews/${review._id}`)
      .set("Authorization", `Bearer ${otherStudentToken}`)
      .send({ rating: 1 });

    expect(response.status).toBe(403);
  });

  test("rejects an invalid review rating", async () => {
    const response = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        college: college._id.toString(),
        rating: 6,
        comment: "Invalid rating",
      });

    expect(response.status).toBe(400);
  });
});

describe("College aggregation integration test", () => {
  test("returns the correct average rating and review count", async () => {
    await Review.create([
      {
        college: college._id,
        student: student._id,
        rating: 4,
        comment: "Good college",
      },
      {
        college: college._id,
        student: otherStudent._id,
        rating: 5,
        comment: "Excellent college",
      },
    ]);

    const response = await request(app)
      .get("/api/colleges")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);

    const result = response.body.colleges.find(
      (item) => item._id.toString() === college._id.toString()
    );

    expect(result.reviewCount).toBe(2);
    expect(result.averageRating).toBe(4.5);
  });
});

describe("College CRUD integration tests", () => {
  test("retrieves a college by ID", async () => {
    const response = await request(app)
      .get(`/api/colleges/${college._id}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.college.name).toBe("Test College");
  });

  test("rejects an invalid college ID", async () => {
    const response = await request(app)
      .get("/api/colleges/invalid-id")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(400);
  });

  test("returns 404 for a college that does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/colleges/${missingId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(404);
  });

  test("allows an admin to create a college", async () => {
    const response = await request(app)
      .post("/api/colleges")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Test College",
        city: "Madurai",
        state: "Tamil Nadu",
      });

    expect(response.status).toBe(201);
    expect(response.body.college.name).toBe("New Test College");
  });

  test("prevents a student from creating a college", async () => {
    const response = await request(app)
      .post("/api/colleges")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        name: "Unauthorized College",
        city: "Salem",
      });

    expect(response.status).toBe(403);
  });

  test("rejects duplicate colleges in the same city", async () => {
    const response = await request(app)
      .post("/api/colleges")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test College",
        city: "Chennai",
        state: "Tamil Nadu",
      });

    expect(response.status).toBe(409);
  });

  test("allows an admin to update a college", async () => {
    const response = await request(app)
      .put(`/api/colleges/${college._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Test College" });

    expect(response.status).toBe(200);
    expect(response.body.college.name).toBe("Updated Test College");
  });

  test("prevents a student from updating a college", async () => {
    const response = await request(app)
      .put(`/api/colleges/${college._id}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ name: "Unauthorized Update" });

    expect(response.status).toBe(403);
  });

  test("allows an admin to delete a college", async () => {
    const response = await request(app)
      .delete(`/api/colleges/${college._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const deletedCollege = await College.findById(college._id);
    expect(deletedCollege).toBeNull();
  });

  test("returns 404 when deleting a missing college", async () => {
    const missingId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/colleges/${missingId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
