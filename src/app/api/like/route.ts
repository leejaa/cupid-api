import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { add } from "date-fns";
import { formatKoreanPhoneNumber } from "@/lib/phone";

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
    const { phone: rawPhone, name } = await req.json();

    if (!rawPhone) {
      return NextResponse.json(
        { error: "전화번호가 필요합니다." },
        { status: 400 }
      );
    }

    const formattedPhone = formatKoreanPhoneNumber(rawPhone);

    // 토큰에서 추출한 사용자 확인
    const fromUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!fromUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 좋아요를 받을 사용자 확인
    let toUser = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    // 대상 사용자가 없으면 새로 생성
    if (!toUser) {
      toUser = await prisma.user.create({
        data: {
          phone: formattedPhone,
          name: name || null,
          isRegistered: false,
        },
      });
    } else if (name && !toUser.name) {
      // 기존 사용자가 있고, 이름이 없는 경우에만 이름 업데이트
      toUser = await prisma.user.update({
        where: { id: toUser.id },
        data: { name },
      });
    }

    // 자기 자신에게 좋아요를 할 수 없음
    if (fromUser.id === toUser.id) {
      return NextResponse.json(
        { error: "자기 자신에게 좋아요를 할 수 없습니다." },
        { status: 400 }
      );
    }

    // 24시간 이내에 좋아요를 한 적이 있는지 확인
    const today = new Date();
    const yesterday = add(today, { days: -1 });

    const existingLike = await prisma.like.findFirst({
      where: {
        fromId: fromUser.id,
        createdAt: {
          gte: yesterday,
        },
        deletedAt: null,
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "24시간 이내에 이미 다른 사용자에게 좋아요를 했습니다." },
        { status: 400 }
      );
    }

    // 이전의 모든 활성화된 좋아요를 soft delete 처리
    await prisma.like.updateMany({
      where: {
        fromId: fromUser.id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // 새로운 좋아요 생성
    const like = await prisma.like.create({
      data: {
        fromId: fromUser.id,
        toId: toUser.id,
      },
    });

    return new NextResponse(JSON.stringify({ success: true, like }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Like API Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
