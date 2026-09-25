import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import MentorAssignment from "@/models/MentorAssignment";
import StudentAcademic from "@/models/StudentAcademic";

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

    if ((token as any).role !== "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Mentor access only",
        },
        { status: 403 }
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
      .populate("student", "name email branch semester")
      .sort({ createdAt: -1 });

    const validAssignments = assignments.filter(
      (assignment: any) => assignment.student
    );

    const studentIds = validAssignments.map(
      (assignment: any) => assignment.student._id
    );

    const academics = await StudentAcademic.find({
      student: { $in: studentIds },
    }).lean();

    const academicMap = new Map(
      academics.map((academic: any) => [
        String(academic.student),
        academic,
      ])
    );

    const students = validAssignments.map((assignment: any) => {
      const student = assignment.student.toObject
        ? assignment.student.toObject()
        : assignment.student;

      return {
        ...assignment.toObject(),
        student: {
          ...student,
          academic:
            academicMap.get(String(student._id)) || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      students,
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
