import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { apiResponse, errorResponse } from "@/lib/api";
import { verifyToken } from "@/lib/auth";
import { formatKoreanPhoneNumber } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];
    if (!token) {
      return errorResponse("인증이 필요합니다.", 401);
    }

    const payload = await verifyToken(token);
    const { quizId, phone: rawPhone, name } = await req.json();

    if (!quizId || !rawPhone) {
      return errorResponse("필수 정보가 누락되었습니다.", 400);
    }

    // 토큰에서 추출한 사용자 확인
    const fromUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!fromUser) {
      return errorResponse("사용자를 찾을 수 없습니다.", 404);
    }

    const formattedPhone = formatKoreanPhoneNumber(rawPhone);

    // 답변으로 선택된 사용자 확인
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

    // 자기 자신을 선택할 수 없음
    if (fromUser.id === toUser.id) {
      return errorResponse("자기 자신을 선택할 수 없습니다.", 400);
    }

    // 퀴즈 존재 여부 확인
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return errorResponse("존재하지 않는 퀴즈입니다.", 404);
    }

    // 이미 답변했는지 확인
    const existingLog = await prisma.quizLog.findFirst({
      where: {
        quizId,
        fromId: fromUser.id,
      },
    });

    if (existingLog) {
      return errorResponse("이미 답변한 퀴즈입니다.", 400);
    }

    // 퀴즈 로그 생성
    const quizLog = await prisma.quizLog.create({
      data: {
        quizId,
        fromId: fromUser.id,
        toId: toUser.id,
      },
    });

    return apiResponse({ quizLog });
  } catch (error) {
    console.error("Quiz Answer API Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
