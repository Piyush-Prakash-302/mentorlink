import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token || (token as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only admin can use this registration API.",
        },
        { status: 403 }
      );
    }

    const {
      name,
      email,
      password,
      role,
      branch,
      semester,
    } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    if (!["student", "mentor", "admin"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role.",
        },
        { status: 400 }
      );
    }

    if (role === "student" && (!branch || !semester)) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch and semester are required for students.",
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
          message: "Email already exists.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
    };

    if (role === "student") {
      userData.branch = branch.trim();
      userData.semester = semester.trim();
    }

    const user = await User.create(userData);

    const { password: _, ...userWithoutPassword } =
      user.toObject();

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully.",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
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
