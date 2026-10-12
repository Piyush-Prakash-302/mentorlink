
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import Meeting from "@/models/Meeting";

export async function POST(req: NextRequest) {
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

    const userId = String((token as any).id);
    const role = String((token as any).role);
    const { meetingId, action } = await req.json();

    if (!meetingId || !["join", "leave"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting ID and a valid action are required.",
        },
        { status: 400 }
      );
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return NextResponse.json(
        { success: false, message: "Meeting not found." },
        { status: 404 }
      );
    }

    const isMentor = String(meeting.mentor) === userId;

    const isStudent =
      role === "student" &&
      meeting.students.some(
        (studentId: any) => String(studentId) === userId
      );

    if (!isMentor && !isStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a participant of this meeting.",
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const start = new Date(meeting.date);
    const end = new Date(
      start.getTime() + (meeting.duration || 30) * 60 * 1000
    );

    if (action === "join") {
      if (
        meeting.status === "completed" ||
        meeting.status === "missed"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "This meeting is no longer available.",
          },
          { status: 403 }
        );
      }

      if (now < start || now > end) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You can join only during the scheduled meeting time.",
          },
          { status: 403 }
        );
      }

      if (isMentor) {
        meeting.mentorJoinedAt =
          meeting.mentorJoinedAt || now;
      } else {
        const alreadyJoined = meeting.studentsJoined.some(
          (entry: any) => String(entry.student) === userId
        );

        if (!alreadyJoined) {
          meeting.studentsJoined.push({
            student: userId,
            joinedAt: now,
          } as any);
        }
      }

      if (meeting.status === "upcoming") {
        meeting.status = "in-progress";
      }

      meeting.startedAt = meeting.startedAt || now;
      await meeting.save();

      return NextResponse.json({
        success: true,
        message: "Meeting attendance recorded.",
        status: meeting.status,
      });
    }

    // Leave action: record the meeting end only when the mentor leaves.
    if (isMentor && meeting.status === "in-progress") {
      meeting.endedAt = now;
      meeting.status = "completed";
      await meeting.save();
    }

    return NextResponse.json({
      success: true,
      message: "Meeting leave event received.",
      status: meeting.status,
    });
  } catch (error: any) {
    console.error("Meeting attendance error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to update attendance.",
      },
      { status: 500 }
    );
  }
}
