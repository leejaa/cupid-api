import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { apiResponse, errorResponse } from "@/lib/api";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];
    if (!token) {
      return errorResponse("인증이 필요합니다.", 401);
    }

    const payload = await verifyToken(token);

    // 가장 최근에 보여진 퀴즈 조회
    const quiz = await prisma.quiz.findFirst({
      where: {
        showedAt: {
          not: null,
        },
      },
      orderBy: {
        showedAt: "desc",
      },
    });

    if (!quiz) {
      return errorResponse("오늘의 퀴즈가 아직 없습니다.", 404);
    }

    // 사용자의 퀴즈 참여 여부 확인
    const quizLog = await prisma.quizLog.findFirst({
      where: {
        quizId: quiz.id,
        fromId: payload.userId,
      },
      include: {
        toUser: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return apiResponse({
      quiz,
      answer: quizLog
        ? {
            name: quizLog.toUser.name || quizLog.toUser.phone,
            phone: quizLog.toUser.phone,
          }
        : null,
    });
  } catch (error) {
    console.error("Today's Quiz API Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
