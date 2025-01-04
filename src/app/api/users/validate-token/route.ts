import { headers } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];

    if (!token) {
      return apiResponse({
        isValid: false,
        message: "토큰이 없습니다.",
      });
    }

    try {
      const payload = await verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });

      if (!user) {
        return apiResponse({
          isValid: false,
          message: "존재하지 않는 사용자입니다.",
        });
      }

      return apiResponse({
        isValid: true,
        userId: payload.userId,
      });
    } catch {
      return apiResponse({
        isValid: false,
        message: "유효하지 않은 토큰입니다.",
      });
    }
  } catch (error) {
    console.error("Token Validation Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
