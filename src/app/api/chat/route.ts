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

export async function GET(req: NextRequest) {
  try {
    const token = await getAuth(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("userId");

    if (!otherUserId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const allowed = await canChat(
      String((token as any).id),
      otherUserId
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Chat is allowed only between assigned mentor and mentee.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const messages = await ChatMessage.find({
      $or: [
        {
          sender: (token as any).id,
          receiver: otherUserId,
        },
        {
          sender: otherUserId,
          receiver: (token as any).id,
        },
      ],
    })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .sort({ createdAt: 1 });

    await ChatMessage.updateMany(
      {
        sender: otherUserId,
        receiver: (token as any).id,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

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

export async function POST(req: NextRequest) {
  try {
    const token = await getAuth(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { receiverId, message } = await req.json();

    if (!receiverId || !message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Receiver and message are required.",
        },
        { status: 400 }
      );
    }

    const allowed = await canChat(
      String((token as any).id),
      receiverId
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only chat with your assigned mentor or mentee.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const chatMessage = await ChatMessage.create({
      sender: (token as any).id,
      receiver: receiverId,
      message: message.trim(),
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
