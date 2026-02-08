import express from "express";
import rateRoutes from "./routes/rateRoutes.js";

const app = express();
app.use(express.json());
app.use(rateRoutes);

app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  console.error("unhandled error", err);
  return res.status(500).json({ error: "Internal Server Error" });
});

export default app;
