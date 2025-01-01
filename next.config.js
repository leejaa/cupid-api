/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // API 라우트에 대한 헤더 설정
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
