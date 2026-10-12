import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import getGridFSBucket from "@/lib/gridfs";
import Assignment from "@/models/Assignment";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendTaskEmail } from "@/lib/email";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// GET ASSIGNMENTS
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

    const userId = (token as any).id;
    const role = (token as any).role;

    let assignments;

    if (role === "mentor") {
      assignments = await Assignment.find({ mentor: userId })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    } else if (role === "student") {
      assignments = await Assignment.find({ students: userId })
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ dueDate: 1 });
    } else {
      assignments = await Assignment.find()
        .populate("students", "name email")
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error: any) {
    console.error("Assignments GET error:", error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// CREATE ASSIGNMENT WITH OPTIONAL ATTACHMENT
export async function POST(req: NextRequest) {
  let bucket: Awaited<ReturnType<typeof getGridFSBucket>> | null = null;
  let uploadedFileId: ObjectId | null = null;
  let createdAssignmentId: any = null;

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

    if ((token as any).role !== "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Only mentor can create assignments",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const mentorId = (token as any).id;
    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let description = "";
    let dueDate = "";
    let studentIds: string[] = [];
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      title = String(formData.get("title") || "");
      description = String(formData.get("description") || "");
      dueDate = String(formData.get("dueDate") || "");

      const rawStudentIds = formData.get("studentIds");

      try {
        studentIds = JSON.parse(String(rawStudentIds || "[]"));
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid student list" },
          { status: 400 }
        );
      }

      const selectedFile = formData.get("file");

console.log("FILE UPLOAD TEST:", {
  exists: selectedFile instanceof File,
  name: selectedFile instanceof File ? selectedFile.name : null,
  size: selectedFile instanceof File ? selectedFile.size : null,
  type: selectedFile instanceof File ? selectedFile.type : null,
});

if (selectedFile instanceof File && selectedFile.size > 0) {
  file = selectedFile;
}
    } else if (contentType.includes("application/json")) {
      const body = await req.json();

      title = body.title || "";
      description = body.description || "";
      dueDate = body.dueDate || "";
      studentIds = body.studentIds || [];
    } else {
      return NextResponse.json(
        { success: false, message: "Unsupported request format" },
        { status: 415 }
      );
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !dueDate ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, description, due date and students are required",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(Date.parse(dueDate))) {
      return NextResponse.json(
        { success: false, message: "Invalid due date" },
        { status: 400 }
      );
    }

    if (!studentIds.every((id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id))) {
      return NextResponse.json(
        { success: false, message: "Invalid student ID" },
        { status: 400 }
      );
    }

    if (new Set(studentIds).size !== studentIds.length) {
      return NextResponse.json(
        { success: false, message: "Duplicate students are not allowed" },
        { status: 400 }
      );
    }

    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        return NextResponse.json(
          {
            success: false,
            message: "Allowed files: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG and WEBP",
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: "Maximum file size is 10 MB" },
          { status: 400 }
        );
      }
    }

    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
    }).select("_id name email");

    if (
      students.length !== studentIds.length ||
      students.some((student: any) => !student._id)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid student selected" },
        { status: 400 }
      );
    }

    const mentor = await User.findOne({
      _id: mentorId,
      role: "mentor",
    }).select("name");

    if (!mentor) {
      return NextResponse.json(
        { success: false, message: "Mentor not found" },
        { status: 404 }
      );
    }

    let fileDetails: Record<string, any> = {};

    if (file) {
      bucket = await getGridFSBucket();

      const uploadStream = bucket.openUploadStream(file.name, {
        metadata: {
          mentorId: String(mentorId),
          purpose: "mentor-assignment",
        },
        contentType: file.type || "application/octet-stream",
      });

      uploadedFileId = uploadStream.id as ObjectId;

      const buffer = Buffer.from(await file.arrayBuffer());

      await new Promise<void>((resolve, reject) => {
        uploadStream.once("finish", () => resolve());
        uploadStream.once("error", reject);
        uploadStream.end(buffer);
      });

      fileDetails = {
        fileId: uploadedFileId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      };
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate),
      mentor: mentorId,
      students: studentIds,
      ...fileDetails,
    });

    createdAssignmentId = assignment._id;

    await Notification.insertMany(
      studentIds.map((studentId: string) => ({
        recipient: studentId,
        title: "New Assignment",
        message: `A new assignment "${title.trim()}" has been assigned to you.`,
        type: "assignment",
        isRead: false,
      }))
    );

    await Promise.allSettled(
      students.map((student: any) =>
        sendTaskEmail({
          to: student.email,
          studentName: student.name,
          senderName: mentor.name || "Mentor",
          senderRole: "mentor",
          taskType: "Assignment",
          title: title.trim(),
          description: description.trim(),
          dueDate,
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Assignment Created Successfully",
      assignment,
    });
  } catch (error: any) {
    console.error("Assignment POST error:", error);

    if (createdAssignmentId) {
      try {
        await Assignment.deleteOne({ _id: createdAssignmentId });
      } catch (cleanupError) {
        console.error("Assignment cleanup error:", cleanupError);
      }
    }

    if (uploadedFileId && bucket) {
      try {
        await bucket.delete(uploadedFileId);
      } catch (cleanupError) {
        console.error("Attachment cleanup error:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to create assignment",
      },
      { status: 500 }
    );
  }
}

// DELETE ASSIGNMENT
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

    if ((token as any).role !== "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Only mentor can delete assignments",
        },
        { status: 403 }
      );
    }

    const mentorId = (token as any).id;
    const { assignmentId } = await req.json();

    if (!assignmentId || !/^[a-f\d]{24}$/i.test(assignmentId)) {
      return NextResponse.json(
        { success: false, message: "Valid assignment ID is required" },
        { status: 400 }
      );
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      mentor: mentorId,
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.fileId) {
      const fileBucket = await getGridFSBucket();

      try {
        await fileBucket.delete(new ObjectId(String(assignment.fileId)));
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          console.error("Attachment deletion error:", error);
        }
      }
    }

    await Assignment.deleteOne({ _id: assignment._id });

    return NextResponse.json({
      success: true,
      message: "Assignment Deleted Successfully",
    });
  } catch (error: any) {
    console.error("Assignment DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to delete assignment",
      },
      { status: 500 }
    );
  }
}