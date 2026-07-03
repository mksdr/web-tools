// tailwind.config.js
module.exports = {
  content: [
    "./*.html",
    "./pages/**/*.html",
    "./qr/**/*.html",
    "./otp/**/*.html",
    "./password-generator/**/*.html",
    "./pixel-art/**/*.html",
    "./gomoku/**/*.html",
    "./gomoku/**/*.js",
    "./js/**/*.js"
  ],
  darkMode: 'class', // 클래스 기반 다크모드 (Auto/Light/Dark 제어용)
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        space: {
          deep: '#0B0B16',   // 깊은 우주 배경색
          card: '#161629',   // 우주 테마 카드 배경색
          accent: '#818CF8', // 은하수 빛 레이저 블루/보라
        },
        google: {
          gray: '#F8F9FA',   // Google 특유의 깔끔한 배경색
          text: '#202124',
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}