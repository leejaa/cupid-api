import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const questions = [
  "나랑 최근에 밥먹은 사람은?",
  "같이 있으면 재밌는 사람은?",
  "가장 예쁜 사람은?",
  "가장 멋진 사람은?",
  "내 고민을 가장 잘 들어줄 것 같은 사람은?",
  "여행을 같이 가고 싶은 사람은?",
  "내 비밀을 말해도 될 것 같은 사람은?",
  "나와 취미가 비슷할 것 같은 사람은?",
  "같이 운동하고 싶은 사람은?",
  "나의 롤모델이 될 수 있는 사람은?",
  "내 이상형에 가장 가까운 사람은?",
  "나와 음악 취향이 비슷할 것 같은 사람은?",
  "함께 영화 보고 싶은 사람은?",
  "나의 단점을 보완해줄 수 있는 사람은?",
  "내가 힘들 때 가장 먼저 연락하고 싶은 사람은?",
  "나와 가장 잘 맞는 케미를 가진 사람은?",
  "같이 카페에서 수다 떨고 싶은 사람은?",
  "내 고민을 가장 잘 해결해줄 것 같은 사람은?",
  "나와 비슷한 가치관을 가진 것 같은 사람은?",
  "평생 친구가 되고 싶은 사람은?",
];

async function main() {
  for (const question of questions) {
    await prisma.quiz.create({
      data: {
        question,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
