import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getThaiDatePrefix, nextDailySeqNumber } from "@/lib/doc-number";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tasks, rooms] = await Promise.all([
    prisma.housekeepingTask.findMany({
      include: { room: true, assignedTo: true },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    }),
    prisma.room.findMany({ orderBy: { roomNumber: "asc" } }),
  ]);

  return NextResponse.json({ tasks, rooms });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const taskType = body.type || "CLEANING";
  const docPrefix = taskType === "MAINTENANCE" ? "MNT" : "HKP";

  const task = await prisma.$transaction(async (tx) => {
    const datePrefix = getThaiDatePrefix();
    const existingTasks = await tx.housekeepingTask.findMany({
      where: { taskCode: { contains: `${datePrefix}-` } },
      select: { taskCode: true },
    });
    const taskCode = nextDailySeqNumber(
      existingTasks.map((t) => t.taskCode),
      docPrefix
    );

    const created = await tx.housekeepingTask.create({
      data: {
        taskCode,
        roomId: body.roomId,
        type: taskType,
        priority: body.priority || "NORMAL",
        notes: body.notes || "",
      },
      include: { room: true },
    });

    if (body.type === "MAINTENANCE" && body.setOutOfOrder) {
      await tx.room.update({
        where: { id: body.roomId },
        data: { status: "OOO", notes: body.notes || "ปิดซ่อมบำรุง" },
      });
    } else if (body.type === "CLEANING") {
      const currentRoom = await tx.room.findUnique({ where: { id: body.roomId } });
      if (currentRoom && currentRoom.status === "VC") {
        await tx.room.update({
          where: { id: body.roomId },
          data: { status: "VD", notes: body.notes || "รอทำความสะอาด" },
        });
      }
    }
    return created;
  });

  return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, status } = (await req.json()) as {
    taskId: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  };

  const updated = await prisma.$transaction(async (tx) => {
    const task = await tx.housekeepingTask.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
      include: { room: true },
    });

    if (status === "COMPLETED") {
      if (task.type === "CLEANING" && task.room.status === "VD") {
        await tx.room.update({
          where: { id: task.roomId },
          data: { status: "VC" },
        });
      } else if (task.type === "MAINTENANCE" && task.room.status === "OOO") {
        await tx.room.update({
          where: { id: task.roomId },
          data: { status: "VC", notes: "" },
        });
      }
    }

    return task;
  });

  return NextResponse.json({ task: updated });
}
