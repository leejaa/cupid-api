import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }

    await verifyToken(token);
    const { phones }: { phones: string[] } = await req.json();

    if (!Array.isArray(phones) || phones.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "전화번호 목록이 필요합니다." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
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

    return new NextResponse(JSON.stringify({ users: results }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Users Check API Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
