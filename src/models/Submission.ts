import mongoose, { Schema, models } from "mongoose";

const SubmissionSchema = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    answer: {
      type: String,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["submitted", "reviewed"],
      default: "submitted",
    },

    feedback: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Submission =
  models.Submission ||
  mongoose.model("Submission", SubmissionSchema);

export default Submission;