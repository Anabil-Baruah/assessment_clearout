import "dotenv/config";
import app from "./app.js";
import { PORT } from "./helpers/constants.js";
import { connect, close } from "./config/db.js";
import { ensureUsageIndexes } from "./models/usageModel.js";

async function start() {
  await connect();
  console.log("MongoDB connected");
  await ensureUsageIndexes();
  const server = app.listen(PORT, () => {
    console.log(`Service available at http://localhost:${PORT}`);
  });
  const shutdown = async () => {
    try {
      await close();
      server.close(() => {
        process.exit(0);
      });
    } catch {
      process.exit(1);
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(() => {
  process.exit(1);
});
