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
    const body = await req.json();

    const {
      name,
      email,
      mobile,
      password,
      branch,
      semester,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and email are required",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: id },
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

    const updateData: any = {
      name: name.trim(),
      email: cleanEmail,
      mobile: mobile?.trim() || "",
      branch: branch?.trim() || "",
      semester: semester?.trim() || "",
    };

    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            message: "Password must be at least 6 characters",
          },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    const student = await User.findOneAndUpdate(
      {
        _id: id,
        role: "student",
      },
      updateData,
      {
        new: true,
      }
    ).select("-password");

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      student,
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

    const student = await User.findOneAndDelete({
      _id: id,
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

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
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
