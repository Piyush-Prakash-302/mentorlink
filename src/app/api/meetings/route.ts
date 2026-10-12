import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { randomUUID } from "crypto";
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
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = String((token as any).id);
    const role = String((token as any).role);
    const now = new Date();

    // Update meetings whose scheduled time has ended.
    const overdueMeetings = await Meeting.find({
      date: { $lte: now },
      status: { $in: ["upcoming", "in-progress"] },
    });

    for (const meeting of overdueMeetings) {
      const endTime =
        new Date(meeting.date).getTime() +
        (Number(meeting.duration) || 30) * 60 * 1000;

      if (now.getTime() < endTime) {
        continue;
      }

      if (meeting.mentorJoinedAt) {
        meeting.status = "completed";
        meeting.endedAt = meeting.endedAt || new Date(endTime);
      } else {
        meeting.status = "missed";
      }

      await meeting.save();
    }

    let meetings;

    if (role === "mentor") {
      meetings = await Meeting.find({ mentor: userId })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ date: 1 });
    } else if (role === "student") {
      meetings = await Meeting.find({ students: userId })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ date: 1 });
    } else if (role === "admin") {
      meetings = await Meeting.find()
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ date: 1 });
    } else {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      meetings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


// CREATE SCHEDULED MEETING
export async function POST(req: NextRequest) {
  try {
    await connectDB();

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

    const mentorId = String((token as any).id);
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
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !date ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide title, description, date and students.",
        },
        { status: 400 }
      );
    }

    const meetingDate = new Date(date);

    if (Number.isNaN(meetingDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid meeting date or time.",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate student IDs.
    const uniqueStudentIds = [
      ...new Set(studentIds.map(String)),
    ];

    const students = await User.find({
      _id: { $in: uniqueStudentIds },
      role: "student",
    });

    if (students.length !== uniqueStudentIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student selected.",
        },
        { status: 400 }
      );
    }

    // Each scheduled meeting receives its own Jitsi room.
    const roomName = `MentorLink-${randomUUID()}`;

    const meeting = await Meeting.create({
      title: title.trim(),
      description: description.trim(),
      date: meetingDate,
      mentor: mentorId,
      students: uniqueStudentIds,
      roomName,
      duration: 30,
      status: "upcoming",
    });

    // Create website notifications.
    const notifications = uniqueStudentIds.map(
      (studentId) => ({
        recipient: studentId,
        title: "New Meeting Scheduled",
        message: `A new meeting "${title.trim()}" has been scheduled for you.`,
        type: "meeting",
        isRead: false,
      })
    );

    await Notification.insertMany(notifications);

    // Send email notifications.
    for (const studentId of uniqueStudentIds) {
      const student = students.find(
        (s) => String(s._id) === studentId
      );

      if (student?.email) {
        try {
          await sendEmail(
            student.email,
            `New Meeting Scheduled - ${title.trim()}`,
            `Hello ${student.name},

A new meeting has been scheduled for you on MentorLink.

Meeting: ${title.trim()}
Description: ${description.trim()}
Date: ${meetingDate.toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}

Duration: 30 minutes

Please log in to MentorLink to view your upcoming meeting.

Regards,
MentorLink`
          );
        } catch (emailError) {
          // A mail delivery issue should not undo a saved meeting.
          console.error(
            "Meeting email failed for student:",
            studentId,
            emailError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Meeting scheduled successfully.",
      meeting,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
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
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const mentorId = String((token as any).id);
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
      message: "Meeting deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
