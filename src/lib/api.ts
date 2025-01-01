/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

interface ApiResponseOptions {
  status?: number;
}

export function apiResponse(data: any, options: ApiResponseOptions = {}) {
  return new NextResponse(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export function errorResponse(message: string, status: number = 400) {
  return apiResponse({ error: message }, { status });
}
