import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import TeacherContent from "@/models/TeacherContent";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token || (token as any).role !== "student") {
      return NextResponse.json(
        {
          success: false,
          message: "Student access only",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const student = await User.findOne({
      _id: (token as any).id,
      role: "student",
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

    if (!student.branch || !student.semester) {
      return NextResponse.json({
        success: true,
        contents: [],
        message: "Branch or semester not assigned",
      });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const teachers = await User.find({
      role: "teacher",
      branch: student.branch,
      semester: student.semester,
    }).select("_id");

    const teacherIds = teachers.map((teacher) => teacher._id);

    const filter: any = {
      teacher: { $in: teacherIds },
    };

    if (type) {
      filter.type = type;
    }

    const contents = await TeacherContent.find(filter)
      .populate("teacher", "name subject")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      contents,
      class: {
        branch: student.branch,
        semester: student.semester,
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
