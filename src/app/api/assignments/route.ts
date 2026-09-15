import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import User from "@/models/User";

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

    const userId = (token as any).id;
    const role = (token as any).role;

    let assignments;

    if (role === "mentor") {
      assignments = await Assignment.find({
        mentor: userId,
      })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    } else if (role === "student") {
      assignments = await Assignment.find({
        students: userId,
      })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ dueDate: 1 });
    } else {
      assignments = await Assignment.find()
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      assignments,
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
    const role = (token as any).role;

    if (role !== "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Only mentor can create assignments",
        },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      dueDate,
      studentIds,
    } = await req.json();

    if (
      !title ||
      !description ||
      !dueDate ||
      !studentIds ||
      studentIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student selected",
        },
        { status: 400 }
      );
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      mentor: mentorId,
      students: studentIds,
    });

    return NextResponse.json({
      success: true,
      message: "Assignment Created Successfully",
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

export async function DELETE(req: NextRequest) {
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
    const role = (token as any).role;

    if (role !== "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Only mentor can delete assignments",
        },
        { status: 403 }
      );
    }

    const { assignmentId } = await req.json();

    if (!assignmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment ID is required",
        },
        { status: 400 }
      );
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      mentor: mentorId,
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment not found",
        },
        { status: 404 }
      );
    }

    await Assignment.findByIdAndDelete(assignmentId);

    return NextResponse.json({
      success: true,
      message: "Assignment Deleted Successfully",
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