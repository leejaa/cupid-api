import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    // 현재 활성화된(삭제되지 않은) 좋아요 정보와 대상 사용자 정보를 함께 조회
    const activeLike = await prisma.like.findFirst({
      where: {
        fromId: payload.userId,
        deletedAt: null,
      },
      include: {
        toUser: {
          select: {
            id: true,
            phone: true,
            name: true,
            isRegistered: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!activeLike) {
      return NextResponse.json({ liked: null });
    }

    return NextResponse.json({
      liked: {
        id: activeLike.id,
        createdAt: activeLike.createdAt,
        user: activeLike.toUser,
      },
    });
  } catch (error) {
    console.error("Liked User API Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
