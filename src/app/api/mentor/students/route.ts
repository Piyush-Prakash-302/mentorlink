import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import MentorAssignment from "@/models/MentorAssignment";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const mentorId = (token as any).id;

    if (!mentorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Mentor ID not found",
        },
        { status: 401 }
      );
    }

    const assignments = await MentorAssignment.find({
      mentor: mentorId,
    })
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      students: assignments,
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