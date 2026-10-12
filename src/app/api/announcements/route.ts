
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import getGridFSBucket from "@/lib/gridfs";
import Announcement from "@/models/Announcement";
import Notification from "@/models/Notification";
import User from "@/models/User";
import MentorAssignment from "@/models/MentorAssignment";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "ppt", "pptx",
  "jpg", "jpeg", "png", "webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = String((token as any).id || "");
    const role = (token as any).role;

    let announcements;

    if (role === "mentor") {
      announcements = await Announcement.find({ mentor: userId })
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    } else if (role === "student") {
      const assignments = await MentorAssignment.find({
        student: userId,
      }).select("mentor");

      const mentorIds = [
        ...new Set(assignments.map((item: any) => String(item.mentor))),
      ];

      announcements = await Announcement.find({
        mentor: { $in: mentorIds },
      })
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    } else if (role === "admin") {
      announcements = await Announcement.find()
        .populate("mentor", "name email")
        .sort({ createdAt: -1 });
    } else {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error: any) {
    console.error("Announcement GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load announcements" },
      { status: 500 }
    );
  }
}

// CREATE ANNOUNCEMENT WITH OPTIONAL ATTACHMENT
export async function POST(req: NextRequest) {
  let uploadedFileId: ObjectId | null = null;
  let createdAnnouncementId: any = null;
  let bucket: Awaited<ReturnType<typeof getGridFSBucket>> | null = null;

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
        { success: false, message: "Only mentor can create announcements" },
        { status: 403 }
      );
    }

    await connectDB();

    const mentorId = String((token as any).id);
    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let message = "";
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      title = String(formData.get("title") || "");
      message = String(formData.get("message") || "");

      const selectedFile = formData.get("file");
      if (selectedFile instanceof File && selectedFile.size > 0) {
        file = selectedFile;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      title = String(body.title || "");
      message = String(body.message || "");
    } else {
      return NextResponse.json(
        { success: false, message: "Unsupported request format" },
        { status: 415 }
      );
    }

    if (!title.trim() || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        return NextResponse.json(
          { success: false, message: "Allowed files: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG and WEBP" },
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
        contentType: file.type || "application/octet-stream",
        metadata: {
          mentorId,
          purpose: "mentor-announcement",
        },
      });

      uploadedFileId = uploadStream.id as ObjectId;
      const buffer = Buffer.from(await file.arrayBuffer());

      await new Promise<void>((resolve, reject) => {
        uploadStream.once("finish", resolve);
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

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      mentor: mentorId,
      ...fileDetails,
    });

    createdAnnouncementId = announcement._id;

    const assignments = await MentorAssignment.find({
      mentor: mentorId,
    }).select("student");

    const studentIds = [
      ...new Set(assignments.map((item: any) => String(item.student))),
    ];

    if (studentIds.length > 0) {
      await Notification.insertMany(
        studentIds.map((studentId) => ({
          recipient: studentId,
          title: "New Announcement",
          message: `Your mentor posted a new announcement: "${title.trim()}".`,
          type: "announcement",
          isRead: false,
        }))
      );

      const students = await User.find({
        _id: { $in: studentIds },
        role: "student",
      }).select("name email");

      await Promise.allSettled(
        students
          .filter((student: any) => student.email)
          .map((student: any) =>
            sendEmail(
              student.email,
              `New Announcement - ${title.trim()}`,
              `Hello ${student.name},

Your mentor has posted a new announcement on MentorLink.

Title: ${title.trim()}

Message:
${message.trim()}

Please login to MentorLink for more details.

Regards,
MentorLink`
            )
          )
      );
    }

    return NextResponse.json({
      success: true,
      message: "Announcement Created Successfully",
      announcement,
    });
  } catch (error: any) {
    console.error("Announcement POST error:", error);

    if (createdAnnouncementId) {
      await Announcement.deleteOne({ _id: createdAnnouncementId }).catch(
        (e) => console.error("Announcement cleanup error:", e)
      );
    }

    if (uploadedFileId && bucket) {
      await bucket.delete(uploadedFileId).catch(
        (e) => console.error("Attachment cleanup error:", e)
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Unable to create announcement" },
      { status: 500 }
    );
  }
}

// DELETE ANNOUNCEMENT AND ITS ATTACHMENT
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
        { success: false, message: "Only mentor can delete announcements" },
        { status: 403 }
      );
    }

    const mentorId = String((token as any).id);
    const body = await req.json();
    const announcementId = body.announcementId;

    if (!announcementId || !/^[a-f\d]{24}$/i.test(announcementId)) {
      return NextResponse.json(
        { success: false, message: "Valid announcement ID is required" },
        { status: 400 }
      );
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      mentor: mentorId,
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, message: "Announcement not found" },
        { status: 404 }
      );
    }

    if (announcement.fileId) {
      try {
        const fileBucket = await getGridFSBucket();
        await fileBucket.delete(new ObjectId(String(announcement.fileId)));
      } catch (error) {
        console.error("Attachment deletion error:", error);
      }
    }

    await Announcement.deleteOne({ _id: announcement._id });

    return NextResponse.json({
      success: true,
      message: "Announcement Deleted Successfully",
    });
  } catch (error: any) {
    console.error("Announcement DELETE error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Unable to delete announcement" },
      { status: 500 }
    );
  }
}
