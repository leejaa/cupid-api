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

      // 활성화된(삭제되지 않은) 좋아요와 보낸 사용자 정보 조회
      const receivedLikes = await prisma.like.findMany({
        where: {
          toId: userId,
          deletedAt: null, // soft delete 되지 않은 좋아요만 조회
        },
        include: {
          fromUser: {
            select: {
              id: true,
              phone: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc", // 최신순 정렬
        },
      });

      // 응답 데이터 가공
      const formattedLikes = receivedLikes.map((like) => ({
        id: like.id,
        createdAt: like.createdAt,
        user: {
          id: like.fromUser.id,
          phone: like.fromUser.phone,
          name: like.fromUser.name,
          createdAt: like.fromUser.createdAt,
        },
      }));

      return apiResponse({
        success: true,
        data: {
          likes: formattedLikes,
        },
      });
    } catch {
      return errorResponse("인증이 필요합니다.", 401);
    }
  } catch (error) {
    console.error("Error in received likes:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
