import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// UPDATE MENTOR
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const { name, email, password, role } = body;

    const updateData: any = {
      name,
      email,
      role,
    };

    if (password && password.trim() !== "") {
      updateData.password = password;
    }

    await User.findByIdAndUpdate(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Mentor Updated Successfully",
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

// DELETE MENTOR
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Mentor Deleted Successfully",
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