require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const identityRoutes = require("./routes/identityRoutes");
const app = express();
const companyreg = require("./routes/companyRegistrationRoutes");
const transportRecommendationRoutes = require("./routes/transportRecommendationRoutes.js");
const transportOrderRoutes = require("./routes/transportOrder.js");
connectDB();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", identityRoutes);
app.use("/api/comp", companyreg);
app.use("/api/transport", transportRecommendationRoutes);
app.use("/api/transport-orders", transportOrderRoutes);
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
