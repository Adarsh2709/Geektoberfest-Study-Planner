import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Cached MongoDB connection — survives Next.js dev hot reload
 * and is reused across requests.
 */
let cached = globalThis.__studyflowMongoose;

if (!cached) {
  cached = globalThis.__studyflowMongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to your .env file.");
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
