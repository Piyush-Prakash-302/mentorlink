
import mongoose, { Schema, models } from "mongoose";

const MeetingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Unique Jitsi room for each scheduled meeting.
    roomName: {
      type: String,
      default: "",
    },

    // Default meeting duration: 30 minutes.
    duration: {
      type: Number,
      default: 30,
      min: 1,
    },

    // Meeting lifecycle status.
    status: {
      type: String,
      enum: [
        "upcoming",
        "in-progress",
        "completed",
        "missed",
      ],
      default: "upcoming",
    },

    // Attendance tracking.
    mentorJoinedAt: {
      type: Date,
      default: null,
    },

    studentsJoined: [
      {
        student: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Meeting =
  models.Meeting || mongoose.model("Meeting", MeetingSchema);

export default Meeting;
