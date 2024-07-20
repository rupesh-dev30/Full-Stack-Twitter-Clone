import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import connectMongoDB from "./database/connectMongoDB.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());  // to parse req.body
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());
app.use("/api/auth", authRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectMongoDB();
});
