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
    const { isEnabled } = await req.json();

    if (typeof isEnabled !== "boolean") {
      return errorResponse("알림 설정 값이 필요합니다.", 400);
    }

    await prisma.notification.update({
      where: { userId: payload.userId },
      data: {
        isEnabled,
        updatedAt: new Date(),
      },
    });

    return apiResponse({ success: true });
  } catch (error) {
    console.error("Notification Settings Update Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
