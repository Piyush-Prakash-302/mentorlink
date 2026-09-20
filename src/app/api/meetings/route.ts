import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email";

// GET MEETINGS
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = (token as any).id;
    const role = (token as any).role;

    let meetings;

    if (role === "mentor") {
      meetings = await Meeting.find({
        mentor: userId,
      })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ date: 1 });
    } else if (role === "student") {
      meetings = await Meeting.find({
        students: userId,
      })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ date: 1 });
    } else {
      meetings = await Meeting.find()
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ date: 1 });
    }

    return NextResponse.json({
      success: true,
      meetings,
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

// CREATE MEETING
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const mentorId = (token as any).id;
    const role = (token as any).role;

    if (role !== "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Only mentor can create meetings",
        },
        { status: 403 }
      );
    }

    const { title, description, date, studentIds } =
      await req.json();

    if (
      !title ||
      !description ||
      !date ||
      !studentIds ||
      studentIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student selected",
        },
        { status: 400 }
      );
    }

    // Create meeting
    const meeting = await Meeting.create({
      title,
      description,
      date,
      mentor: mentorId,
      students: studentIds,
    });

    // Create website notifications
    const notifications = studentIds.map(
      (studentId: string) => ({
        recipient: studentId,
        title: "New Meeting Scheduled",
        message: `A new meeting "${title}" has been scheduled for you.`,
        type: "meeting",
        isRead: false,
      })
    );

    await Notification.insertMany(notifications);

    // Send email notification to each student
    for (const studentId of studentIds) {
      const student = students.find(
        (s) => s._id.toString() === studentId
      );

      if (student?.email) {
        await sendEmail(
          student.email,
          `New Meeting Scheduled - ${title}`,
          `Hello ${student.name},

A new meeting has been scheduled for you on MentorLink.

Meeting: ${title}
Description: ${description}
Date: ${new Date(date).toLocaleString("en-IN")}

Please login to MentorLink for more details.

Regards,
MentorLink`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Meeting Created Successfully",
      meeting,
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

// DELETE MEETING
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const mentorId = (token as any).id;
    const role = (token as any).role;

    if (role !== "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Only mentor can delete meetings",
        },
        { status: 403 }
      );
    }

    const { meetingId } = await req.json();

    if (!meetingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting ID is required",
        },
        { status: 400 }
      );
    }

    const meeting = await Meeting.findOne({
      _id: meetingId,
      mentor: mentorId,
    });

    if (!meeting) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting not found",
        },
        { status: 404 }
      );
    }

    await Meeting.findByIdAndDelete(meetingId);

    return NextResponse.json({
      success: true,
      message: "Meeting Deleted Successfully",
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