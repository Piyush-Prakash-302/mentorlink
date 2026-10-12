import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token || (token as any).role !== "admin") {
    return null;
  }

  return token;
}

export async function GET(req: NextRequest) {
  try {
    const token = await requireAdmin(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Admin access only." },
        { status: 403 }
      );
    }

    await connectDB();

    const admins = await User.find({ role: "admin" })
      .select("_id name email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error("Admin list error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load admins." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdmin(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Admin access only." },
        { status: 403 }
      );
    }

    await connectDB();

    const { name, email, password } = await req.json();

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "This email is already registered." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "admin",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Admin created successfully.",
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "This email is already registered." },
        { status: 409 }
      );
    }

    console.error("Admin creation error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create admin." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await requireAdmin(req);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Admin access only." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const currentAdminId = (token as any).id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Admin ID is required." },
        { status: 400 }
      );
    }

    if (id === currentAdminId) {
      return NextResponse.json(
        { success: false, message: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    await connectDB();

    const targetAdmin = await User.findOne({
      _id: id,
      role: "admin",
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin not found." },
        { status: 404 }
      );
    }

    const adminCount = await User.countDocuments({ role: "admin" });

    if (adminCount <= 1) {
      return NextResponse.json(
        { success: false, message: "The last admin cannot be deleted." },
        { status: 400 }
      );
    }

    await User.deleteOne({
      _id: targetAdmin._id,
      role: "admin",
    });

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully.",
    });
  } catch (error) {
    console.error("Admin deletion error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete admin." },
      { status: 500 }
    );
  }
}
