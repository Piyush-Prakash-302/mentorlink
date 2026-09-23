import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MentorAssignment from "@/models/MentorAssignment";
import User from "@/models/User";

// GET ASSIGNMENTS
export async function GET() {
  try {
    await connectDB();

    const assignments = await MentorAssignment.find()
      .populate({
        path: "student",
        select: "name email",
        match: { role: "student" },
      })
      .populate({
        path: "mentor",
        select: "name email",
        match: { role: "mentor" },
      })
      .sort({ createdAt: -1 });

    const validAssignments = assignments.filter(
      (assignment: any) => assignment.student && assignment.mentor
    );

    return NextResponse.json({
      success: true,
      assignments: validAssignments,
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

// ASSIGN MENTOR
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { studentId, mentorId } = await req.json();

    if (!studentId || !mentorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Student and Mentor are required",
        },
        { status: 400 }
      );
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    const mentor = await User.findOne({
      _id: mentorId,
      role: "mentor",
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 }
      );
    }

    if (!mentor) {
      return NextResponse.json(
        {
          success: false,
          message: "Mentor not found",
        },
        { status: 404 }
      );
    }

    const existingAssignment = await MentorAssignment.findOne({
      student: studentId,
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          message: "This student is already assigned to a mentor",
        },
        { status: 400 }
      );
    }

    const assignment = await MentorAssignment.create({
      student: studentId,
      mentor: mentorId,
    });

    return NextResponse.json({
      success: true,
      message: "Mentor Assigned Successfully",
      assignment,
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
