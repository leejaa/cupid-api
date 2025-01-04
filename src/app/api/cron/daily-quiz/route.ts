import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { apiResponse, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    // Vercel Cron 인증 확인
    const headersList = await headers();
    const authHeader = headersList.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse("Unauthorized", 401);
    }

    // 아직 노출되지 않은 퀴즈 중 랜덤으로 하나 선택
    const quiz = await prisma.quiz.findFirst({
      where: {
        showedAt: null,
      },
      orderBy: {
        // 랜덤 정렬
        id: "asc",
      },
    });

    if (!quiz) {
      // 모든 퀴즈가 이미 노출되었다면 showedAt을 모두 null로 초기화
      await prisma.quiz.updateMany({
        data: {
          showedAt: null,
        },
      });

      // 다시 랜덤으로 하나 선택
      const resetQuiz = await prisma.quiz.findFirst({
        orderBy: {
          id: "asc",
        },
      });

      if (!resetQuiz) {
        return errorResponse("No quiz available", 404);
      }

      // 선택된 퀴즈의 showedAt 업데이트
      await prisma.quiz.update({
        where: { id: resetQuiz.id },
        data: { showedAt: new Date() },
      });

      return apiResponse({ quiz: resetQuiz });
    }

    // 선택된 퀴즈의 showedAt 업데이트
    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { showedAt: new Date() },
    });

    return apiResponse({ quiz });
  } catch (error) {
    console.error("Daily Quiz Cron Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
