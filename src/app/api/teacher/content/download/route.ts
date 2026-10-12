
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import TeacherContent from "@/models/TeacherContent";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token || (token as any).role !== "student") {
      return NextResponse.json(
        { success: false, message: "Student access only" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid content ID" },
        { status: 400 }
      );
    }

    const content: any = await TeacherContent.findById(id).lean();

    if (!content || !content.fileId) {
      return NextResponse.json(
        { success: false, message: "Attached file not found" },
        { status: 404 }
      );
    }

    const student: any = await User.findOne({
      _id: (token as any).id,
      role: "student",
    })
      .select("branch semester")
      .lean();

    if (!student?.branch || !student?.semester) {
      return NextResponse.json(
        { success: false, message: "Student class not found" },
        { status: 403 }
      );
    }

    const teacher = await User.findOne({
      _id: content.teacher,
      role: "teacher",
      branch: student.branch,
      semester: student.semester,
    }).select("_id");

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (!ObjectId.isValid(String(content.fileId))) {
      return NextResponse.json(
        { success: false, message: "Invalid file ID" },
        { status: 400 }
      );
    }

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection unavailable");
    }

    const bucket = new GridFSBucket(db, {
      bucketName: "mentorlinkFiles",
    });

    const fileId = new ObjectId(String(content.fileId));
    const files = await bucket.find({ _id: fileId }).toArray();
    const file = files[0];

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File not found in storage" },
        { status: 404 }
      );
    }

    const safeName = String(
      content.fileName || file.filename || "attachment"
    ).replace(/[\r\n"]/g, "_");

    const contentType = String(
      content.fileType ||
        file.contentType ||
        "application/octet-stream"
    );

    const stream = bucket.openDownloadStream(fileId);

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        stream.on("data", (chunk: Buffer) => {
          controller.enqueue(
            new Uint8Array(chunk)
          );
        });
        stream.on("end", () => controller.close());
        stream.on("error", (error: Error) =>
          controller.error(error)
        );
      },
      cancel() {
        stream.destroy();
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Teacher attachment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to open attached file",
      },
      { status: 500 }
    );
  }
}
