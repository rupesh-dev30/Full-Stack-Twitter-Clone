import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import connectMongoDB from "./database/connectMongoDB.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectMongoDB();
});
