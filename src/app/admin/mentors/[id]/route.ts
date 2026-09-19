import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const mentor = await User.findOneAndUpdate(
      { _id: id, role: "mentor" },
      {
        name: body.name,
        email: body.email,
      },
      { new: true }
    ).select("-password");

    if (!mentor) {
      return NextResponse.json(
        { success: false, message: "Mentor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mentor,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
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

    const mentor = await User.findOneAndDelete({
      _id: id,
      role: "mentor",
    });

    if (!mentor) {
      return NextResponse.json(
        { success: false, message: "Mentor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mentor deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
