
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ObjectId } from "mongodb";
import { Readable } from "stream";
import connectDB from "@/lib/mongodb";
import getGridFSBucket from "@/lib/gridfs";
import User from "@/models/User";
import TeacherContent from "@/models/TeacherContent";
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

async function getTeacherToken(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if ((token as any).role !== "teacher") {
    return {
      error: NextResponse.json(
        { success: false, message: "Teacher access only" },
        { status: 403 }
      ),
    };
  }

  return { token };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getTeacherToken(req);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const filter: any = {
      teacher: (auth.token as any).id,
    };

    if (type) filter.type = type;

    const contents = await TeacherContent.find(filter)
      .sort({ createdAt: -1 })
      .populate("teacher", "name subject")
      .lean();

    return NextResponse.json({
      success: true,
      contents,
    });
  } catch (error: any) {
    console.error("Teacher content GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load content." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let bucket: Awaited<ReturnType<typeof getGridFSBucket>> | null = null;
  let uploadedFileId: ObjectId | null = null;
  let createdContentId: any = null;

  try {
    const auth = await getTeacherToken(req);
    if (auth.error) return auth.error;

    await connectDB();

    const teacher = await User.findOne({
      _id: (auth.token as any).id,
      role: "teacher",
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Teacher not found." },
        { status: 404 }
      );
    }

    if (!teacher.branch || !teacher.semester) {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher branch and semester are required.",
        },
        { status: 400 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let type = "";
    let title = "";
    let description = "";
    let dueDate: string | null = null;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      type = String(formData.get("type") || "");
      title = String(formData.get("title") || "");
      description = String(formData.get("description") || "");
      dueDate = String(formData.get("dueDate") || "") || null;

      const selectedFile = formData.get("file");

      if (selectedFile instanceof File && selectedFile.size > 0) {
        file = selectedFile;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();

      type = body.type || "";
      title = body.title || "";
      description = body.description || "";
      dueDate = body.dueDate || null;
    } else {
      return NextResponse.json(
        { success: false, message: "Unsupported request format." },
        { status: 415 }
      );
    }

    const allowedContentTypes = [
      "announcement",
      "assignment",
      "homework",
      "practical",
      "class-info",
    ];

    if (!allowedContentTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid content type." },
        { status: 400 }
      );
    }

    if (!title.trim() || !description.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and description are required.",
        },
        { status: 400 }
      );
    }

    if (dueDate && Number.isNaN(Date.parse(dueDate))) {
      return NextResponse.json(
        { success: false, message: "Invalid due date." },
        { status: 400 }
      );
    }

    let fileDetails: any = {};

    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        return NextResponse.json(
          { success: false, message: "This file type is not allowed." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: "Maximum file size is 10 MB." },
          { status: 400 }
        );
      }

      // File ko MongoDB GridFS mein store karo.
      bucket = await getGridFSBucket();

      const uploadStream = bucket.openUploadStream(file.name, {
        metadata: {
          teacherId: String(teacher._id),
          purpose: "teacher-assignment",
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

    const content = await TeacherContent.create({
      teacher: teacher._id,
      type,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      ...fileDetails,
    });

    createdContentId = content._id;

    const students = await User.find({
      role: "student",
      branch: teacher.branch,
      semester: teacher.semester,
    }).select("_id name email");

    const notificationType =
      type === "announcement"
        ? "announcement"
        : ["assignment", "homework", "practical"].includes(type)
        ? "assignment"
        : "general";

    if (students.length > 0) {
      await Notification.insertMany(
        students.map((student: any) => ({
          recipient: student._id,
          title: title.trim(),
          message: `${teacher.name}: ${description.trim()}`,
          type: notificationType,
          isRead: false,
        }))
      );

      const taskType =
        type === "assignment"
          ? "Assignment"
          : type === "homework"
          ? "Homework"
          : type === "practical"
          ? "Practical"
          : type === "announcement"
          ? "Announcement"
          : "Class Information";

      await Promise.allSettled(
        students.map((student: any) =>
          sendTaskEmail({
            to: student.email,
            studentName: student.name,
            senderName: teacher.name,
            senderRole: "teacher",
            taskType,
            title: title.trim(),
            description: description.trim(),
            dueDate: dueDate || null,
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content published successfully.",
      content,
      studentsCount: students.length,
      targetClass: {
        branch: teacher.branch,
        semester: teacher.semester,
      },
    });
  } catch (error: any) {
    console.error("Teacher content POST error:", error);

    // Content creation fail hone par uploaded file clean up karo.
    if (createdContentId) {
      try {
        await TeacherContent.deleteOne({ _id: createdContentId });
      } catch (cleanupError) {
        console.error("Content cleanup error:", cleanupError);
      }
    }

    if (uploadedFileId && bucket) {
      try {
        await bucket.delete(uploadedFileId);
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to publish content.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getTeacherToken(req);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, message: "Valid content ID is required." },
        { status: 400 }
      );
    }

    const content = await TeacherContent.findOne({
      _id: id,
      teacher: (auth.token as any).id,
    });

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Content not found." },
        { status: 404 }
      );
    }

    // File ko delete karne se pehle ownership verify ho chuki hai.
    if (content.fileId) {
      const bucket = await getGridFSBucket();

      try {
        await bucket.delete(new ObjectId(String(content.fileId)));
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
    }

    await TeacherContent.deleteOne({ _id: content._id });

    return NextResponse.json({
      success: true,
      message: "Content deleted successfully.",
    });
  } catch (error: any) {
    console.error("Teacher content DELETE error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete content." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getTeacherToken(req);
    if (auth.error) return auth.error;

    const body = await req.json();

    const { id, type, title, description, dueDate } = body;

    if (
      !id ||
      !/^[a-f\d]{24}$/i.test(id) ||
      !type ||
      !title?.trim() ||
      !description?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid ID, type, title and description are required.",
        },
        { status: 400 }
      );
    }

    const allowedContentTypes = [
      "announcement",
      "assignment",
      "homework",
      "practical",
      "class-info",
    ];

    if (!allowedContentTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid content type." },
        { status: 400 }
      );
    }

    if (dueDate && Number.isNaN(Date.parse(dueDate))) {
      return NextResponse.json(
        { success: false, message: "Invalid due date." },
        { status: 400 }
      );
    }

    await connectDB();

    const content = await TeacherContent.findOneAndUpdate(
      {
        _id: id,
        teacher: (auth.token as any).id,
      },
      {
        type,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
      },
      { new: true, runValidators: true }
    );

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Content not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content updated successfully.",
      content,
    });
  } catch (error: any) {
    console.error("Teacher content PUT error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update content." },
      { status: 500 }
    );
  }
}
