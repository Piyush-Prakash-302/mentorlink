import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if ((token as any).role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher access only" },
        { status: 403 }
      );
    }

    await connectDB();

    const teacher = await User.findById((token as any).id)
      .select("-password");

    if (!teacher || teacher.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher,
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