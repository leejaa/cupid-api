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

      // 활성화된(삭제되지 않은) 좋아요 수 조회
      const likeCount = await prisma.like.count({
        where: {
          toId: userId,
          deletedAt: null, // soft delete 되지 않은 좋아요만 카운트
        },
      });

      return apiResponse({
        success: true,
        data: {
          count: likeCount,
        },
      });
    } catch {
      return errorResponse("인증이 필요합니다.", 401);
    }
  } catch (error) {
    console.error("Error in like count:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
