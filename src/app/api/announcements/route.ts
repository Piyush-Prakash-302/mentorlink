import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import Announcement from "@/models/Announcement";
import Notification from "@/models/Notification";

// GET ANNOUNCEMENTS
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

    let announcements;

    if (role === "mentor") {
      announcements = await Announcement.find({
        mentor: userId,
      })
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    } else if (role === "student") {
      announcements = await Announcement.find({
        mentor: {
          $in: await getStudentMentorIds(userId),
        },
      })
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    } else {
      announcements = await Announcement.find()
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      announcements,
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

// CREATE ANNOUNCEMENT
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
          message: "Only mentor can create announcements",
        },
        { status: 403 }
      );
    }

    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and message are required",
        },
        { status: 400 }
      );
    }

    const announcement = await Announcement.create({
      title,
      message,
      mentor: mentorId,
    });

    // Get students assigned to this mentor
    const MentorAssignment = (
      await import("@/models/MentorAssignment")
    ).default;

    const assignments = await MentorAssignment.find({
      mentor: mentorId,
    }).select("student");

    const studentIds = assignments.map(
      (assignment) => assignment.student.toString()
    );

    // Create notification for each assigned student
    if (studentIds.length > 0) {
      const notifications = studentIds.map((studentId) => ({
        recipient: studentId,
        title: "New Announcement",
        message: `Your mentor posted a new announcement: "${title}".`,
        type: "announcement",
        isRead: false,
      }));

      await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      success: true,
      message: "Announcement Created Successfully",
      announcement,
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

async function getStudentMentorIds(studentId: string) {
  const MentorAssignment = (
    await import("@/models/MentorAssignment")
  ).default;

  const assignments = await MentorAssignment.find({
    student: studentId,
  }).select("mentor");

  return assignments.map((assignment) => assignment.mentor);
}

// DELETE ANNOUNCEMENT
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
          message: "Only mentor can delete announcements",
        },
        { status: 403 }
      );
    }

    const { announcementId } = await req.json();

    if (!announcementId) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement ID is required",
        },
        { status: 400 }
      );
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      mentor: mentorId,
    });

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found",
        },
        { status: 404 }
      );
    }

    await Announcement.findByIdAndDelete(announcementId);

    return NextResponse.json({
      success: true,
      message: "Announcement Deleted Successfully",
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