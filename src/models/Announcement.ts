
import mongoose, { Schema, models } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    fileName: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Announcement =
  models.Announcement ||
  mongoose.model("Announcement", AnnouncementSchema);

export default Announcement;
