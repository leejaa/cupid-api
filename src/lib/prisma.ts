import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const formatPhoneNumber = (
  phone: string | Prisma.StringFieldUpdateOperationsInput | null | undefined
): string => {
  if (!phone) return "";
  const phoneStr = typeof phone === "string" ? phone : phone.set;
  if (!phoneStr) return "";

  // 모든 공백과 하이픈 제거
  const normalized = phoneStr.replace(/[\s-]/g, "");

  // 이미 +82로 시작하는 경우 그대로 반환
  if (normalized.startsWith("+82")) {
    return normalized;
  }

  // 010으로 시작하는 경우 +82로 변환
  if (normalized.startsWith("010")) {
    return `+82${normalized.slice(1)}`;
  }

  return normalized;
};

const prismaClient = new PrismaClient({
  log: ["query"],
}).$extends({
  model: {
    user: {
      async beforeCreate({ args }: { args: Prisma.UserCreateArgs }) {
        if (args.data.phone) {
          args.data.phone = formatPhoneNumber(args.data.phone);
        }
      },
      async beforeUpdate({ args }: { args: Prisma.UserUpdateArgs }) {
        if (args.data.phone) {
          args.data.phone = { set: formatPhoneNumber(args.data.phone) };
        }
      },
    },
  },
}) as unknown as PrismaClient;

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
