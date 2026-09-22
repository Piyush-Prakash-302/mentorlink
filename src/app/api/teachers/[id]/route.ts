import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const {
      name,
      email,
      mobile,
      password,
      subject,
      branch,
      semester,
      section,
    } = await req.json();

    const teacher = await User.findOne({
      _id: id,
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

    teacher.name = name;
    teacher.email = email.toLowerCase().trim();
    teacher.mobile = mobile;
    teacher.subject = subject;
    teacher.branch = branch;
    teacher.semester = semester;
    teacher.section = section;

    if (password && password.trim() !== "") {
      teacher.password = await bcrypt.hash(password, 10);
    }

    await teacher.save();

    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const teacher = await User.findOne({
      _id: id,
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

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
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