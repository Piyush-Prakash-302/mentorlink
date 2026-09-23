import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();

    const teachers = await User.find({ role: "teacher" })
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      teachers,
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

    const {
      name,
      email,
      mobile,
      password,
      subject,
      branch,
      semester,
    } = await req.json();

    if (
      !name ||
      !email ||
      !password ||
      !subject ||
      !branch ||
      !semester
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email, password, subject, branch and semester are required",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await User.create({
      name: name.trim(),
      email: cleanEmail,
      mobile: mobile?.trim() || "",
      password: hashedPassword,
      role: "teacher",
      subject: subject.trim(),
      branch: branch.trim(),
      semester: semester.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Teacher created successfully",
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        mobile: teacher.mobile,
        role: teacher.role,
        subject: teacher.subject,
        branch: teacher.branch,
        semester: teacher.semester,
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
