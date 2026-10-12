
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import getGridFSBucket from "@/lib/gridfs";
import Announcement from "@/models/Announcement";
import MentorAssignment from "@/models/MentorAssignment";

export const runtime = "nodejs";

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

    const userId = String((token as any).id || "");
    const role = (token as any).role;

    if (role !== "mentor" && role !== "student") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const download = searchParams.get("download") === "1";

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    const announcement: any = await Announcement.findById(id).lean();

    if (!announcement || !announcement.fileId) {
      return NextResponse.json(
        { success: false, message: "Attachment not found" },
        { status: 404 }
      );
    }

    let hasAccess = false;

    if (role === "mentor") {
      hasAccess = String(announcement.mentor) === userId;
    } else {
      const mentorAssignment = await MentorAssignment.findOne({
        mentor: announcement.mentor,
        student: userId,
      }).select("_id");

      hasAccess = Boolean(mentorAssignment);
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (!ObjectId.isValid(String(announcement.fileId))) {
      return NextResponse.json(
        { success: false, message: "Invalid attachment ID" },
        { status: 400 }
      );
    }

    const bucket = await getGridFSBucket();
    const fileId = new ObjectId(String(announcement.fileId));
    const files = await bucket.find({ _id: fileId }).toArray();
    const storedFile = files[0];

    if (!storedFile) {
      return NextResponse.json(
        { success: false, message: "File not found in storage" },
        { status: 404 }
      );
    }

    const safeName = String(
      announcement.fileName || storedFile.filename || "attachment"
    ).replace(/[\r\n"]/g, "_");

    const contentType = String(
      announcement.fileType ||
        storedFile.contentType ||
        "application/octet-stream"
    );

    const fileStream = bucket.openDownloadStream(fileId);

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        fileStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        fileStream.on("end", () => controller.close());
        fileStream.on("error", (error: Error) =>
          controller.error(error)
        );
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${
          download ? "attachment" : "inline"
        }; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Announcement download error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to open attachment" },
      { status: 500 }
    );
  }
}
