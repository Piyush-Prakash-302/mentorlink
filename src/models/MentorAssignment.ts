import mongoose, { Schema, models } from "mongoose";

const MentorAssignmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MentorAssignment =
  models.MentorAssignment ||
  mongoose.model("MentorAssignment", MentorAssignmentSchema);

export default MentorAssignment;