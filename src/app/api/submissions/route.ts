import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";

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

    let submissions;

    if (role === "student") {
      submissions = await Submission.find({
        student: userId,
      })
        .populate("assignment", "title description dueDate")
        .populate("student", "name email")
        .sort({ createdAt: -1 });
    } else if (role === "mentor") {
      const assignments = await Assignment.find({
        mentor: userId,
      }).select("_id");

      const assignmentIds = assignments.map(
        (assignment) => assignment._id
      );

      submissions = await Submission.find({
        assignment: { $in: assignmentIds },
      })
        .populate("assignment", "title description dueDate")
        .populate("student", "name email")
        .sort({ createdAt: -1 });
    } else {
      submissions = await Submission.find()
        .populate("assignment", "title description dueDate")
        .populate("student", "name email")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      submissions,
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

    const studentId = (token as any).id;
    const role = (token as any).role;

    if (role !== "student") {
      return NextResponse.json(
        {
          success: false,
          message: "Only student can submit assignment",
        },
        { status: 403 }
      );
    }

    const { assignmentId, answer } = await req.json();

    if (!assignmentId || !answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment and answer are required",
        },
        { status: 400 }
      );
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      students: studentId,
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment not found",
        },
        { status: 404 }
      );
    }

    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    if (existingSubmission) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already submitted this assignment",
        },
        { status: 400 }
      );
    }

    const submission = await Submission.create({
      assignment: assignmentId,
      student: studentId,
      answer,
      status: "submitted",
    });

    return NextResponse.json({
      success: true,
      message: "Assignment Submitted Successfully",
      submission,
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

export async function PATCH(req: NextRequest) {
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
          message: "Only mentor can review submissions",
        },
        { status: 403 }
      );
    }

    const { submissionId, feedback } = await req.json();

    if (!submissionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission ID is required",
        },
        { status: 400 }
      );
    }

    const mentorAssignments = await Assignment.find({
      mentor: mentorId,
    }).select("_id");

    const assignmentIds = mentorAssignments.map(
      (assignment) => assignment._id
    );

    const submission = await Submission.findOne({
      _id: submissionId,
      assignment: { $in: assignmentIds },
    });

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission not found",
        },
        { status: 404 }
      );
    }

    submission.feedback = feedback?.trim() || "";
    submission.status = "reviewed";
    submission.reviewedAt = new Date();

    await submission.save();

    return NextResponse.json({
      success: true,
      message: "Submission reviewed successfully",
      submission,
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