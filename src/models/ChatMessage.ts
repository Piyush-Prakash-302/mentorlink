
import mongoose, { Schema, models } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // True when the receiver has read the message.
    isRead: {
      type: Boolean,
      default: false,
    },

    // When the message was confirmed as delivered.
    deliveredAt: {
      type: Date,
      default: null,
    },

    // When the receiver read the message.
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default models.ChatMessage ||
  mongoose.model("ChatMessage", ChatMessageSchema);