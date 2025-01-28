import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { SignJWT } from "jose";
// import { verifyToken } from "@/lib/sms"; // 임시로 주석 처리
import { getJwtSecretKey } from "@/lib/auth";
import { apiResponse, errorResponse } from "@/lib/api";
import { normalizePhoneNumber } from "@/lib/phone";

const prisma = new PrismaClient();

const verifySchema = z.object({
  phone: z.string(),
  code: z.string().length(6, "인증번호는 6자리여야 합니다"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // const { phone: rawPhone, code } = verifySchema.parse(body);
    const { phone: rawPhone } = verifySchema.parse(body);
    const phone = normalizePhoneNumber(rawPhone);

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return errorResponse("사용자를 찾을 수 없습니다.", 404);
    }

    // 개발 편의성을 위해 임시로 모든 인증 코드를 허용
    // TODO: 실제 인증 로직으로 변경 필요
    /* 실제 인증 로직 시작
    try {
      const verification = await verifyToken(phone, code);

      if (!verification.valid) {
        return errorResponse("잘못된 인증번호입니다.", 400);
      }
    } catch (error) {
      console.error("인증 코드 확인 오류:", error);
      return errorResponse(
        error instanceof Error
          ? error.message
          : "인증 코드 확인에 실패했습니다.",
        500
      );
    }
    실제 인증 로직 끝 */

    await prisma.user.update({
      where: { phone },
      data: { isRegistered: true },
    });

    // JWT 토큰 생성
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1y")
      .sign(new TextEncoder().encode(getJwtSecretKey()));

    return apiResponse({
      success: true,
      message: "인증이 완료되었습니다.",
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }

    console.error("Error in verify-code:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
