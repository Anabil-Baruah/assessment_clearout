import { getCollection } from "../config/db.js";
import { COLLECTION_NAME } from "../helpers/constants.js";

export async function usageCollection() {
  return await getCollection(COLLECTION_NAME);
}

export async function ensureUsageIndexes() {
  const col = await usageCollection();
  await col.createIndex({ userId: 1, windowStart: 1 }, { unique: true });
}
