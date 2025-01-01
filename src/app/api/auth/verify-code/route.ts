import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { SignJWT } from "jose";
import { verifyToken } from "@/lib/sms";
import { getJwtSecretKey } from "@/lib/auth";

const prisma = new PrismaClient();

const verifySchema = z.object({
  phone: z.string(),
  code: z.string().length(6, "인증번호는 6자리여야 합니다"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = verifySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    try {
      const verification = await verifyToken(phone, code);

      if (!verification.valid) {
        return NextResponse.json(
          { success: false, message: "잘못된 인증번호입니다." },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("인증 코드 확인 오류:", error);
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "인증 코드 확인에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // JWT 토큰 생성
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1y")
      .sign(new TextEncoder().encode(getJwtSecretKey()));

    return NextResponse.json({
      success: true,
      message: "인증이 완료되었습니다.",
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error in verify-code:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
