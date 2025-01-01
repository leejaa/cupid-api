import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

interface Friend {
  name: string;
  phone: string;
}

// 친구 목록 저장 API
export async function POST(req: Request) {
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
    const { friends }: { friends: Friend[] } = await req.json();

    if (!Array.isArray(friends) || friends.length === 0) {
      return NextResponse.json(
        { error: "친구 목록이 필요합니다." },
        { status: 400 }
      );
    }

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 친구 목록 저장 (upsert 사용)
    const results = await Promise.all(
      friends.map((friend) =>
        prisma.friend.upsert({
          where: {
            userId_phone: {
              userId: user.id,
              phone: friend.phone,
            },
          },
          update: {
            name: friend.name,
          },
          create: {
            userId: user.id,
            name: friend.name,
            phone: friend.phone,
          },
        })
      )
    );

    return NextResponse.json({ success: true, friends: results });
  } catch (error) {
    console.error("Friends API Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 친구 목록 조회 API
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

    // 사용자의 친구 목록 조회
    const friends = await prisma.friend.findMany({
      where: {
        userId: payload.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Friends API Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
