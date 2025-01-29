import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, errorResponse } from "@/lib/api";
import { verifyToken } from "@/lib/auth";

interface QuizStat {
  quiz: {
    id: string;
    question: string;
    showedAt: Date | null;
  };
  selectedCount: number;
  selectedBy: Array<{
    id: string;
    phone: string;
    name: string | null;
    selectedAt: Date;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    // 인증 확인
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("인증이 필요합니다.", 401);
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = await verifyToken(token);
      const userId = decoded.userId;

      // 나를 지목한 모든 퀴즈 로그와 관련 정보 조회
      const quizLogs = await prisma.quizLog.findMany({
        where: {
          toId: userId,
        },
        include: {
          quiz: {
            select: {
              id: true,
              question: true,
              showedAt: true,
            },
          },
          fromUser: {
            select: {
              id: true,
              phone: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // 퀴즈별로 그룹화하여 통계 생성
      const quizStats = quizLogs.reduce<Record<string, QuizStat>>(
        (acc, log) => {
          const quizId = log.quiz.id;
          if (!acc[quizId]) {
            acc[quizId] = {
              quiz: {
                id: log.quiz.id,
                question: log.quiz.question,
                showedAt: log.quiz.showedAt,
              },
              selectedCount: 0,
              selectedBy: [],
            };
          }
          acc[quizId].selectedCount++;
          acc[quizId].selectedBy.push({
            id: log.fromUser.id,
            phone: log.fromUser.phone,
            name: log.fromUser.name,
            selectedAt: log.createdAt,
          });
          return acc;
        },
        {}
      );

      // 통계 데이터 정리
      const stats = {
        totalSelectedCount: quizLogs.length,
        uniqueQuizCount: Object.keys(quizStats).length,
        quizzes: Object.values(quizStats).sort(
          (a, b) =>
            b.selectedCount - a.selectedCount ||
            (b.quiz.showedAt?.getTime() ?? 0) -
              (a.quiz.showedAt?.getTime() ?? 0)
        ),
      };

      return apiResponse({
        success: true,
        data: stats,
      });
    } catch {
      return errorResponse("인증이 필요합니다.", 401);
    }
  } catch (error) {
    console.error("Error in quiz selection stats:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
