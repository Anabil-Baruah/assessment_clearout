import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rate_limiter";
const dbName = process.env.DB_NAME || "rate_limiter";

let client;
let db;

export async function connect() {
  if (!client) {
    client = new MongoClient(uri, { maxPoolSize: 10, retryWrites: true });
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

export function getDb() {
  if (!db) throw new Error("DB not connected");
  return db;
}

export async function getCollection(name) {
  const database = db || (await connect());
  return database.collection(name);
}

export async function close() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}
