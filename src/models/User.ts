import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: false,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "mentor", "teacher", "student"],
      default: "student",
    },

    subject: {
      type: String,
      required: false,
      trim: true,
    },

    branch: {
      type: String,
      required: false,
      trim: true,
    },

    semester: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.User || mongoose.model("User", UserSchema);
