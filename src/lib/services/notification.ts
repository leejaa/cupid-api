import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class NotificationService {
  private readonly API_URL =
    "https://fcm.googleapis.com/v1/projects/{PROJECT_ID}/messages:send";
  private readonly PROJECT_ID: string;
  private readonly EMAIL: string;
  private readonly PRIVATE_KEY: string;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const email = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !email || !privateKey) {
      throw new Error("Firebase configuration is missing");
    }

    this.PROJECT_ID = projectId;
    this.EMAIL = email;
    this.PRIVATE_KEY = privateKey;
  }

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const token = jwt.sign(
      {
        iss: this.EMAIL,
        sub: this.EMAIL,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600, // 1시간
        scope: "https://www.googleapis.com/auth/firebase.messaging",
      },
      this.PRIVATE_KEY,
      { algorithm: "RS256" }
    );

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: token,
      }),
    });

    const data = await response.json();
    return data.access_token;
  }

  async sendToUser(userId: string, payload: NotificationPayload) {
    try {
      // 사용자의 FCM 토큰 조회
      const notification = await prisma.notification.findUnique({
        where: { userId },
        select: { token: true, isEnabled: true },
      });

      if (!notification?.token || !notification.isEnabled) {
        throw new Error("알림을 보낼 수 없는 사용자입니다.");
      }

      return this.sendToToken(notification.token, payload);
    } catch (error) {
      console.error("Failed to send notification:", error);
      throw error;
    }
  }

  private async sendToToken(token: string, payload: NotificationPayload) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      this.API_URL.replace("{PROJECT_ID}", this.PROJECT_ID),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: payload.data || {},
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`FCM API Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}

// 싱글톤 인스턴스 생성
export const notificationService = new NotificationService();
