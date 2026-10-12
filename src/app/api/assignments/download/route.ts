import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import getGridFSBucket from "@/lib/gridfs";
import Assignment from "@/models/Assignment";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Check login
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
        { success: false, message: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    // Find assignment and verify access
    const assignment: any = await Assignment.findById(id).lean();

    if (!assignment || !assignment.fileId) {
      return NextResponse.json(
        { success: false, message: "Attachment not found" },
        { status: 404 }
      );
    }

    const hasAccess =
      role === "mentor"
        ? String(assignment.mentor) === String(userId)
        : assignment.students.some(
            (studentId: any) =>
              String(studentId) === String(userId)
          );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (!ObjectId.isValid(String(assignment.fileId))) {
      return NextResponse.json(
        { success: false, message: "Invalid attachment ID" },
        { status: 400 }
      );
    }

    const bucket = await getGridFSBucket();
    const fileId = new ObjectId(String(assignment.fileId));

    const files = await bucket.find({ _id: fileId }).toArray();
    const file = files[0];

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File not found in storage" },
        { status: 404 }
      );
    }

    const safeName = String(
      assignment.fileName || file.filename || "attachment"
    ).replace(/[\r\n"]/g, "_");

    const contentType = String(
      assignment.fileType ||
        file.contentType ||
        "application/octet-stream"
    );

    const stream = bucket.openDownloadStream(fileId);

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        stream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        stream.on("end", () => {
          controller.close();
        });

        stream.on("error", (error: Error) => {
          controller.error(error);
        });
      },

      cancel() {
        stream.destroy();
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
    console.error("Assignment attachment download error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to open attachment",
      },
      { status: 500 }
    );
  }
}
