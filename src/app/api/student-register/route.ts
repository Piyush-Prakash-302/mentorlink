import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import AuthorizedEmail from "@/models/AuthorizedEmail";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      name,
      email,
      mobile,
      branch,
      semester,
      password,
    } = await req.json();

    if (!name || !email || !password || !branch || !semester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email, branch, semester and password are required.",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile?.trim() || "";

    const authorizedEmail = await AuthorizedEmail.findOne({
      email: cleanEmail,
    });

    if (!authorizedEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This email is not authorized for student registration.",
        },
        { status: 403 }
      );
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered.",
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

    if (cleanMobile && !/^[0-9]{10}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number must be exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      branch: branch.trim(),
      semester: semester.trim(),
      password: hashedPassword,
      role: "student",
    });

    // Email configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send registration confirmation email
    await transporter.sendMail({
      from: `"MentorLink" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject: "Welcome to MentorLink",
      text: `Hello ${name.trim()},

Your student registration on MentorLink has been completed successfully.

Your registered details:
Name: ${name.trim()}
Email: ${cleanEmail}
Branch: ${branch.trim()}
Semester: ${semester.trim()}

You can now login to your MentorLink account using your registered email and password.

Regards,
MentorLink Team`,
    });

    const { password: _, ...userWithoutPassword } =
      user.toObject();

    return NextResponse.json(
      {
        success: true,
        message:
          "Student registered successfully. Confirmation email sent.",
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