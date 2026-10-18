const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.setTimeout(60000);

describe("MongoDB diagnostic", () => {
  let mongoServer;

  afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  });

  test("connects Mongoose to in-memory MongoDB", async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: "7.0.14",
      },
    });

    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    expect(mongoose.connection.readyState).toBe(1);

    const result = await mongoose.connection.db.admin().ping();

    expect(result.ok).toBe(1);

    console.log("MongoDB connection successful");
    console.log("Mongoose version:", mongoose.version);
  });
});
