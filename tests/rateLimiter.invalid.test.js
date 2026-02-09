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

test("missing userId returns 400", async () => {
  const res = await request(app)
    .post("/api/hit")
    .set("Content-Type", "application/json")
    .send({});
  expect(res.status).toBe(400);
});

test("invalid JSON returns 400", async () => {
  const res = await request(app)
    .post("/api/hit")
    .set("Content-Type", "application/json")
    .send('{"userId": user_invalid}');
  expect(res.status).toBe(400);
});
