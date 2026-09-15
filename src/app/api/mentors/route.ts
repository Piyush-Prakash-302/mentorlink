import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const mentors = await User.find({ role: "mentor" })
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      mentors,
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