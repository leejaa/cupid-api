import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendVerificationToken } from "@/lib/sms";
import { apiResponse, errorResponse } from "@/lib/api";
import { normalizePhoneNumber } from "@/lib/phone";

const prisma = new PrismaClient();

const phoneSchema = z.object({
  phone: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone: rawPhone } = phoneSchema.parse(body);
    const phone = normalizePhoneNumber(rawPhone);

    // 사용자 찾기 또는 생성
    await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
      },
    });

    // 인증 코드 전송
    try {
      await sendVerificationToken(phone);
    } catch (error) {
      console.error("인증 코드 전송 오류:", error);
      return errorResponse(
        error instanceof Error
          ? error.message
          : "인증 코드 전송에 실패했습니다.",
        500
      );
    }

    return apiResponse({
      success: true,
      message: "인증 코드가 전송되었습니다.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }

    console.error("Error in send-code:", error);
    return errorResponse("서버 오류가 발생했습니다.", 500);
  }
}
