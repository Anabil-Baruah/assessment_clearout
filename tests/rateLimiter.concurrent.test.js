import request from "supertest";
import app from "../src/app.js";
import { connect, getDb, close } from "../src/config/db.js";
import { ensureUsageIndexes } from "../src/models/usageModel.js";
import { COLLECTION_NAME } from "../src/helpers/constants.js";

beforeAll(async () => {
  process.env.DB_NAME = process.env.DB_NAME || "rate_limiter_test";
  await connect();
  await ensureUsageIndexes();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  const db = getDb();
  await db.collection(COLLECTION_NAME).deleteMany({});
});

test("only first 5 of 10 concurrent hits succeed; rest 429", async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      request(app)
        .post("/api/hit")
        .set("Content-Type", "application/json")
        .send({ userId: "user_concurrent" })
    );
  }
  const results = await Promise.all(promises);
  const ok = results.filter((r) => r.status === 200).length;
  const limited = results.filter((r) => r.status === 429).length;
  expect(ok).toBe(5);
  expect(limited).toBe(5);
});
