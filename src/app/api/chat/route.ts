import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import MentorAssignment from "@/models/MentorAssignment";
import ChatMessage from "@/models/ChatMessage";

async function getAuth(req: NextRequest) {
  return await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
}

async function canChat(userId: string, otherUserId: string) {
  const user = await User.findById(userId).select("role");
  const other = await User.findById(otherUserId).select("role");

  if (!user || !other) return false;

  if (user.role === "mentor" && other.role === "student") {
    const assignment = await MentorAssignment.findOne({
      mentor: userId,
      student: otherUserId,
    });

    return !!assignment;
  }

  if (user.role === "student" && other.role === "mentor") {
    const assignment = await MentorAssignment.findOne({
      mentor: otherUserId,
      student: userId,
    });

    return !!assignment;
  }

  return false;
}

// GET CHAT MESSAGES
export async function GET(req: NextRequest) {
  try {
    const token = await getAuth(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUserId = String((token as any).id);
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("userId");

    if (!otherUserId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const allowed = await canChat(currentUserId, otherUserId);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Chat is allowed only between assigned mentor and mentee.",
        },
        { status: 403 }
      );
    }

    // Mark messages as delivered when the receiver fetches this chat.
    await ChatMessage.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        deliveredAt: null,
      },
      {
        $set: { deliveredAt: new Date() },
      }
    );

    // Mark incoming messages as read when the receiver opens/polls this chat.
    await ChatMessage.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Fetch after updating receipts so the response contains current statuses.
    const messages = await ChatMessage.find({
      $or: [
        {
          sender: currentUserId,
          receiver: otherUserId,
        },
        {
          sender: otherUserId,
          receiver: currentUserId,
        },
      ],
    })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// SEND MESSAGE
export async function POST(req: NextRequest) {
  try {
    const token = await getAuth(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const senderId = String((token as any).id);
    const { receiverId, message } = await req.json();

    if (
      !receiverId ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Receiver and message are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const allowed = await canChat(senderId, String(receiverId));

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only chat with your assigned mentor or mentee.",
        },
        { status: 403 }
      );
    }

    const chatMessage = await ChatMessage.create({
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
      isRead: false,
      deliveredAt: null,
      readAt: null,
    });

    const populatedMessage = await ChatMessage.findById(
      chatMessage._id
    )
      .populate("sender", "name role")
      .populate("receiver", "name role");

    return NextResponse.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
