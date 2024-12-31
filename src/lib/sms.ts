import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendVerificationToken(to: string) {
  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to,
        channel: "sms",
      });

    return { success: true, status: verification.status };
  } catch (error) {
    console.error("인증 코드 전송 실패:", error);
    throw new Error("인증 코드 전송에 실패했습니다.");
  }
}

export async function verifyToken(to: string, code: string) {
  try {
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to,
        code,
      });

    return {
      success: true,
      valid: verificationCheck.status === "approved",
    };
  } catch (error) {
    console.error("인증 코드 확인 실패:", error);
    throw new Error("인증 코드 확인에 실패했습니다.");
  }
}
