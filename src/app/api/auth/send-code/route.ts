import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendVerificationToken } from "@/lib/sms";

const prisma = new PrismaClient();

// 입력 데이터 검증을 위한 스키마
const phoneSchema = z.object({
  phone: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = phoneSchema.parse(body);

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
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "인증 코드 전송에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "인증 코드가 전송되었습니다.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error in send-code:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
