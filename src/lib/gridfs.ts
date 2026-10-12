import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

export default async function getGridFSBucket() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected.");
  }

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database is unavailable.");
  }

  return new GridFSBucket(db, {
    bucketName: "mentorlinkFiles",
  });
}