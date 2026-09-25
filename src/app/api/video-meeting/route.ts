import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import MentorAssignment from "@/models/MentorAssignment";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

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

    await connectDB();

    const currentUser = await User.findById(
      (token as any).id
    ).select("name role");

    const otherUser = await User.findById(otherUserId).select(
      "name role"
    );

    if (!currentUser || !otherUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    let mentorId = "";
    let studentId = "";

    if (
      currentUser.role === "mentor" &&
      otherUser.role === "student"
    ) {
      mentorId = String(currentUser._id);
      studentId = String(otherUser._id);
    } else if (
      currentUser.role === "student" &&
      otherUser.role === "mentor"
    ) {
      mentorId = String(otherUser._id);
      studentId = String(currentUser._id);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Video meeting is only available between mentor and mentee.",
        },
        { status: 403 }
      );
    }

    const assignment = await MentorAssignment.findOne({
      mentor: mentorId,
      student: studentId,
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only start a meeting with your assigned mentor or mentee.",
        },
        { status: 403 }
      );
    }

    const roomKey = `${mentorId}:${studentId}`;

    const roomHash = crypto
      .createHash("sha256")
      .update(roomKey)
      .digest("hex")
      .slice(0, 32);

    const roomName = `MentorLink-${roomHash}`;

    return NextResponse.json({
      success: true,
      roomName,
      currentUser: {
        name: currentUser.name,
        role: currentUser.role,
      },
      otherUser: {
        name: otherUser.name,
        role: otherUser.role,
      },
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
