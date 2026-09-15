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

    const studentId = (token as any).id;

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Student ID not found",
        },
        { status: 401 }
      );
    }

    const assignment = await MentorAssignment.findOne({
      student: studentId,
    }).populate("mentor", "name email");

    if (!assignment) {
      return NextResponse.json({
        success: true,
        mentor: null,
      });
    }

    return NextResponse.json({
      success: true,
      mentor: assignment.mentor,
      assignedAt: assignment.assignedAt,
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