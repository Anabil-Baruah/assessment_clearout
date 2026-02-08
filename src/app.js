import express from "express";
import rateRoutes from "./routes/rateRoutes.js";

const app = express();
app.use(express.json());
app.use(rateRoutes);

export default app;
