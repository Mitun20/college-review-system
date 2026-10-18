const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/authRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "College Review System API is running",
  });
});

app.get("/openapi.yaml", (req, res) => {
  res.type("text/yaml").sendFile(
    path.join(__dirname, "../docs/openapi.yaml")
  );
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: "/openapi.yaml",
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/reviews", reviewRoutes);

module.exports = app;
