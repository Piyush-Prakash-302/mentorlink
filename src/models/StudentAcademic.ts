import mongoose, { Schema, models } from "mongoose";

const StudentAcademicSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    semester1: { type: Number, default: null },
    semester2: { type: Number, default: null },
    semester3: { type: Number, default: null },
    semester4: { type: Number, default: null },
    semester5: { type: Number, default: null },
    semester6: { type: Number, default: null },
  },
  { timestamps: true }
);

export default models.StudentAcademic ||
  mongoose.model("StudentAcademic", StudentAcademicSchema);
