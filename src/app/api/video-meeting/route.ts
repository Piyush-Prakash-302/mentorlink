
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import MentorAssignment from "@/models/MentorAssignment";
import Meeting from "@/models/Meeting";
import crypto from "crypto";

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

    await connectDB();

    const currentUserId = String((token as any).id);
    const { searchParams } = new URL(req.url);

    const meetingId = searchParams.get("meetingId");
    const otherUserId = searchParams.get("userId");

    const currentUser = await User.findById(currentUserId).select(
      "name role"
    );

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Current user not found." },
        { status: 404 }
      );
    }

    // SCHEDULED MEETING FLOW
    if (meetingId) {
      const meeting = await Meeting.findById(meetingId)
        .populate("mentor", "name role")
        .populate("students", "name role");

      if (!meeting) {
        return NextResponse.json(
          { success: false, message: "Meeting not found." },
          { status: 404 }
        );
      }

      const mentor = meeting.mentor as any;
      const students = meeting.students as any[];

      const isMentor =
        String(mentor?._id) === currentUserId;

      const isSelectedStudent = students.some(
        (student) => String(student?._id) === currentUserId
      );

      if (!isMentor && !isSelectedStudent) {
        return NextResponse.json(
          {
            success: false,
            message: "You are not a participant of this meeting.",
          },
          { status: 403 }
        );
      }

      if (meeting.status === "completed" || meeting.status === "missed") {
        return NextResponse.json(
          {
            success: false,
            message: "This meeting is no longer available.",
          },
          { status: 403 }
        );
      }

      // Use the saved room name for scheduled meetings.
      // Older meetings without a room name receive a stable fallback.
      let roomName = meeting.roomName;

      if (!roomName) {
        const roomHash = crypto
          .createHash("sha256")
          .update(`meeting:${String(meeting._id)}`)
          .digest("hex")
          .slice(0, 32);

        roomName = `MentorLink-${roomHash}`;

        await Meeting.updateOne(
          { _id: meeting._id, roomName: "" },
          { $set: { roomName } }
        );
      }

      return NextResponse.json({
        success: true,
        meetingId: String(meeting._id),
        roomName,
        meeting: {
          title: meeting.title,
          date: meeting.date,
          duration: meeting.duration || 30,
          status: meeting.status,
        },
        currentUser: {
          name: currentUser.name,
          role: currentUser.role,
        },
        otherUser: {
          name: isMentor
            ? students.map((student) => student.name).join(", ")
            : mentor?.name || "Mentor",
          role: isMentor ? "student" : "mentor",
        },
      });
    }

    // LEGACY CHAT VIDEO CALL FLOW
    if (!otherUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting ID or user ID is required.",
        },
        { status: 400 }
      );
    }

    const otherUser = await User.findById(otherUserId).select(
      "name role"
    );

    if (!otherUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    let mentorId = "";
    let studentId = "";

    if (
      currentUser.role === "mentor" &&
      otherUser.role === "student"
    ) {
      mentorId = currentUserId;
      studentId = String(otherUser._id);
    } else if (
      currentUser.role === "student" &&
      otherUser.role === "mentor"
    ) {
      mentorId = String(otherUser._id);
      studentId = currentUserId;
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            "Video meeting is only available between mentor and mentee.",
        },
        { status: 403 }
      );
    }

    const assignment = await MentorAssignment.findOne({
      mentor: mentorId,
      student: studentId,
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only start a meeting with your assigned mentor or mentee.",
        },
        { status: 403 }
      );
    }

    const roomHash = crypto
      .createHash("sha256")
      .update(`${mentorId}:${studentId}`)
      .digest("hex")
      .slice(0, 32);

    return NextResponse.json({
      success: true,
      roomName: `MentorLink-${roomHash}`,
      currentUser: {
        name: currentUser.name,
        role: currentUser.role,
      },
      otherUser: {
        name: otherUser.name,
        role: otherUser.role,
      },
    });
  } catch (error: any) {
    console.error("Video meeting API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to load meeting.",
      },
      { status: 500 }
    );
  }
}