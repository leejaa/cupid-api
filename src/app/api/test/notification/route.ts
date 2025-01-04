import { notificationService } from "@/lib/services/notification";
import { apiResponse, errorResponse } from "@/lib/api";

export async function POST() {
  try {
    const result = await notificationService.sendToUser(
      "cm5i0sdtw000d008esp6toomm",
      {
        title: "테스트 알림",
        body: "안녕하세요! FCM 알림 테스트입니다.",
        data: {
          type: "test",
          timestamp: new Date().toISOString(),
        },
      }
    );

    return apiResponse({ success: true, result });
  } catch (error) {
    console.error("Test Notification Error:", error);
    return errorResponse("알림 전송 중 오류가 발생했습니다.", 500);
  }
}
