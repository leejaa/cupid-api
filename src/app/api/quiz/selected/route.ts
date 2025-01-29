import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, errorResponse } from "@/lib/api";
import { verifyToken } from "@/lib/auth";

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

      // 나를 지목한 모든 퀴즈 로그 조회
      const quizLogs = await prisma.quizLog.findMany({
        where: {
          toId: userId,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              phone: true,
              name: true,
            },
          },
          quiz: {
            select: {
              question: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (quizLogs.length === 0) {
        return apiResponse({
          success: true,
          data: {
            isSelected: false,
            message: "아직 아무도 회원님을 지목하지 않았습니다.",
          },
        });
      }

      return apiResponse({
        success: true,
        data: {
          isSelected: true,
          message: "회원님은 퀴즈의 답으로 지목된 적이 있습니다!",
          selections: quizLogs.map((log) => ({
            id: log.id,
            selectedBy: {
              id: log.fromUser.id,
              phone: log.fromUser.phone,
              name: log.fromUser.name,
            },
            quiz: {
              question: log.quiz.question,
            },
            createdAt: log.createdAt,
          })),
        },
      });
    } catch {
      return errorResponse("인증이 필요합니다.", 401);
    }
  } catch (error) {
    console.error("Error in quiz selections check:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
