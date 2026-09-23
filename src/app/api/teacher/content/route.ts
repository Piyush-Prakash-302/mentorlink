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

    if (!token || (token as any).role !== "teacher") {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher access only",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const filter: any = {
      teacher: (token as any).id,
    };

    if (type) {
      filter.type = type;
    }

    const contents = await TeacherContent.find(filter)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      contents,
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
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token || (token as any).role !== "teacher") {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher access only",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const {
      type,
      title,
      description,
      dueDate,
    } = await req.json();

    if (!type || !title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Type, title and description are required",
        },
        { status: 400 }
      );
    }

    const teacher = await User.findOne({
      _id: (token as any).id,
      role: "teacher",
    });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher not found",
        },
        { status: 404 }
      );
    }

    if (!teacher.branch || !teacher.semester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Teacher branch and semester are not assigned",
        },
        { status: 400 }
      );
    }

    const content = await TeacherContent.create({
      teacher: teacher._id,
      type,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
    });

    const students = await User.find({
      role: "student",
      branch: teacher.branch,
      semester: teacher.semester,
    }).select("_id name email");

    return NextResponse.json({
      success: true,
      message: "Content shared successfully",
      content,
      targetClass: {
        branch: teacher.branch,
        semester: teacher.semester,
      },
      studentsCount: students.length,
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

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token || (token as any).role !== "teacher") {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher access only",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Content ID is required",
        },
        { status: 400 }
      );
    }

    const deleted = await TeacherContent.findOneAndDelete({
      _id: id,
      teacher: (token as any).id,
    });

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Content not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content deleted successfully",
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
