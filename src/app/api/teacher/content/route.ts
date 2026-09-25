import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import TeacherContent from "@/models/TeacherContent";
import Notification from "@/models/Notification";
import { sendTaskEmail } from "@/lib/email";

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

    if ((token as any).role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher access only" },
        { status: 403 }
      );
    }

    await connectDB();

    const teacherId = (token as any).id;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const filter: any = {
      teacher: teacherId,
    };

    if (type) {
      filter.type = type;
    }

    const contents = await TeacherContent.find(filter)
      .sort({ createdAt: -1 })
      .populate("teacher", "name subject");

    return NextResponse.json({
      success: true,
      contents,
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

    if ((token as any).role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher access only" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      type,
      title,
      description,
      dueDate,
    } = body;

    if (!type || !title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Type, title and description are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const teacher = await User.findById(
      (token as any).id
    );

    if (!teacher || teacher.role !== "teacher") {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher not found.",
        },
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

    const content = await TeacherContent.create({
      teacher: teacher._id,
      type,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
    });

    const students = await User.find({
      role: "student",
      branch: teacher.branch,
      semester: teacher.semester,
    }).select("_id name email");

    let notificationType = "general";

    if (
      type === "assignment" ||
      type === "homework" ||
      type === "practical"
    ) {
      notificationType = "assignment";
    } else if (type === "announcement") {
      notificationType = "announcement";
    }

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

      const contentType =
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
            taskType: contentType,
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
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    if ((token as any).role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher access only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Content ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted = await TeacherContent.findOneAndDelete({
      _id: id,
      teacher: (token as any).id,
    });

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Content not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content deleted successfully.",
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

export async function PUT(req: NextRequest) {
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

    if ((token as any).role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher access only" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      id,
      type,
      title,
      description,
      dueDate,
    } = body;

    if (!id || !type || !title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "ID, type, title and description are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const content = await TeacherContent.findOneAndUpdate(
      {
        _id: id,
        teacher: (token as any).id,
      },
      {
        type,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
      },
      {
        new: true,
      }
    );

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Content not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content updated successfully.",
      content,
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
