import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();

  // UTF-8 인코딩 설정
  response.headers.set("Content-Type", "application/json; charset=utf-8");

  return response;
}

// 모든 API 라우트에 미들웨어 적용
export const config = {
  matcher: "/api/:path*",
};
