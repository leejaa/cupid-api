import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";
import { apiResponse, errorResponse } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];
    if (!token) {
      return errorResponse("인증이 필요합니다.", 401);
    }

    await verifyToken(token);
    const { phones }: { phones: string[] } = await req.json();

    if (!Array.isArray(phones) || phones.length === 0) {
      return errorResponse("전화번호 목록이 필요합니다.", 400);
    }

    // 전화번호 정규화
    const normalizedPhones = phones.map((phone) => normalizePhoneNumber(phone));

    // 사용자 조회
    const users = await prisma.user.findMany({
      where: {
        phone: {
          in: normalizedPhones,
        },
      },
      select: {
        phone: true,
        isRegistered: true,
      },
    });

    // 결과 매핑
    const results = normalizedPhones.map((phone) => {
      const user = users.find((u) => u.phone === phone);
      return {
        phone,
        isRegistered: user ? user.isRegistered : false,
      };
    });

    return apiResponse({ users: results });
  } catch (error) {
    console.error("Users Check API Error:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
