import mongoose, { Schema, models } from "mongoose";

const AuthorizedEmailSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const AuthorizedEmail =
  models.AuthorizedEmail ||
  mongoose.model("AuthorizedEmail", AuthorizedEmailSchema);

export default AuthorizedEmail;