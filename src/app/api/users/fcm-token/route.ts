// src/app/api/users/fcm-token/route.ts
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiResponse, errorResponse } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];
    if (!token) {
      return errorResponse("인증이 필요합니다.", 401);
    }

    const payload = await verifyToken(token);
    const { fcmToken } = await req.json();

    if (!fcmToken) {
      return errorResponse("FCM 토큰이 필요합니다.", 400);
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { fcmToken },
    });

    return apiResponse({ success: true });
  } catch (error) {
    console.error("FCM Token Update Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
