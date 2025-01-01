export function normalizePhoneNumber(phone: string): string {
  // 모든 공백과 하이픈 제거
  return phone.replace(/[\s-]/g, "");
}

export function formatKoreanPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.startsWith("010")) {
    return `+82${normalized.slice(1)}`; // 010을 +82로 변환
  }
  return normalized;
}
