import mongoose, { Schema, models } from "mongoose";

const TeacherContentSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "announcement",
        "assignment",
        "homework",
        "practical",
        "class-info",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default models.TeacherContent ||
  mongoose.model("TeacherContent", TeacherContentSchema);
