import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { apiResponse, errorResponse } from "@/lib/api";
import { notificationService } from "@/lib/services/notification";

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

    let selectedQuiz = quiz;

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

      selectedQuiz = resetQuiz;
    }

    if (!selectedQuiz) {
      return errorResponse("No quiz available", 404);
    }

    // 선택된 퀴즈의 showedAt 업데이트
    await prisma.quiz.update({
      where: { id: selectedQuiz.id },
      data: { showedAt: new Date() },
    });

    // 알림이 활성화된 모든 사용자 조회
    const usersWithNotification = await prisma.user.findMany({
      where: {
        notification: {
          isEnabled: true,
        },
      },
      select: {
        id: true,
      },
    });

    // 모든 사용자에게 한 번에 알림 전송
    try {
      await notificationService.sendToMultipleUsers(
        usersWithNotification.map((user) => user.id),
        {
          title: "오늘의 퀴즈",
          body: selectedQuiz.question,
          data: {
            type: "daily-quiz",
            quizId: selectedQuiz.id,
            timestamp: new Date().toISOString(),
          },
        }
      );
    } catch (error) {
      console.error("Failed to send notifications:", error);
    }

    return apiResponse({ quiz: selectedQuiz });
  } catch (error) {
    console.error("Daily Quiz Cron Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
