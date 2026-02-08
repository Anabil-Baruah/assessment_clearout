import { usageCollection } from "../models/usageModel.js";
import { LIMIT_PER_MINUTE } from "../helpers/constants.js";
import { getWindowStartDate, minuteString } from "../helpers/time.js";

export async function hit(req, res) {
  try {
    const { userId } = req.body || {};
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId is required" });
    }

    const windowStart = getWindowStartDate();
    const key = { userId, windowStart };
    const col = await usageCollection();

    const incResult = await col.findOneAndUpdate(
      { ...key, count: { $lt: LIMIT_PER_MINUTE } },
      { $inc: { count: 1 } },
      { returnDocument: "after" }
    );

    if (incResult.value) {
      return res.status(200).json({
        userId,
        minute: minuteString(windowStart),
        count: incResult.value.count,
        limit: LIMIT_PER_MINUTE,
        status: "ok",
      });
    }

    const existing = await col.findOne(key);
    if (existing && existing.count >= LIMIT_PER_MINUTE) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded", limit: LIMIT_PER_MINUTE });
    }

    try {
      await col.insertOne({ ...key, count: 1 });
      return res.status(200).json({
        userId,
        minute: minuteString(windowStart),
        count: 1,
        limit: LIMIT_PER_MINUTE,
        status: "ok",
      });
    } catch (err) {
      if (err && err.code === 11000) {
        const incResult2 = await col.findOneAndUpdate(
          { ...key, count: { $lt: LIMIT_PER_MINUTE } },
          { $inc: { count: 1 } },
          { returnDocument: "after" }
        );
        if (incResult2.value) {
          return res.status(200).json({
            userId,
            minute: minuteString(windowStart),
            count: incResult2.value.count,
            limit: LIMIT_PER_MINUTE,
            status: "ok",
          });
        }
        return res
          .status(429)
          .json({ error: "Rate limit exceeded", limit: LIMIT_PER_MINUTE });
      }
      throw err;
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function usage(req, res) {
  try {
    const userId = req.params.userId;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId param is required" });
    }
    const windowStart = getWindowStartDate();
    const key = { userId, windowStart };
    const col = await usageCollection();
    const doc = await col.findOne(key);
    const count = doc ? doc.count : 0;
    return res.status(200).json({
      userId,
      minute: minuteString(windowStart),
      count,
      limit: LIMIT_PER_MINUTE,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
