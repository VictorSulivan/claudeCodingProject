import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: eventId } = await params;

  await prisma.agendaEntry.deleteMany({
    where: { userId: session.user.id, eventId },
  });

  return NextResponse.json({ success: true });
}
