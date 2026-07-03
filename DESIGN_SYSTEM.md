# UI/UX 디자인 시스템 및 레이아웃 규칙 (DESIGN_SYSTEM.md)

## 1. 디자인 컨셉
- **Light Theme:** Google 특유의 극도의 깔끔함, 넓은 여백(Whitespace), 명확한 시각적 계층 구조.
- **Dark Theme:** 'Deep Space(깊은 우주)'를 연상시키는 딥 스페이스 블루 배경과 은하수 빛 엑센트 컬러.
- **공통 요소:** 과감한 여백의 미를 살리고, 부드러운 라운딩(`rounded-2xl`)과 은은한 글래스모피즘(`backdrop-blur`)을 조합하여 세련된 FE 툴 감성을 제공합니다.

## 2. 테마 시스템 (3-Way Theme Switcher)
1. **기기 테마(System Auto) 최우선:** 사용자가 설정을 바꾸지 않았다면 OS 테마를 먼저 따릅니다.
2. **수동 토글 제공:** 사용자는 상단 헤더의 스위처를 통해 [Auto / Light / Dark]를 명시적으로 선택할 수 있습니다.
3. **디자인 토큰:**
   - **Light Bg:** `#F8F9FA` (Google Gray) / **Text:** `#202124`
   - **Dark Bg:** `#0B0B16` (Deep Space Blue) / **Card:** `#161629` / **Text:** `#F3F4F6`
   - **Accent Color:** `#6366F1` 또는 `#818CF8` (Cosmic Indigo/Indigo)

## 3. 반응형 2컬럼 레이아웃 (Two-Column Layout)
모든 서브 도구 페이지(`pages/*.html`)는 Tailwind의 Grid/Flex를 활용하여 다음과 같은 반응형 구조를 엄격히 준수합니다.

- **Mobile (sm 이하):** 1단 세로 배열 (입력창이 위에 오고, 결과창이 아래로 배치)
- **Tablet / PC (md 이상):** 좌우 2컬럼 배열
  - **좌측 컬럼 (Left Column):** 설정 및 데이터 입력 폼 (Input fields, Toggles, Buttons)
  - **우측 컬럼 (Right Column):** 결과 화면 및 인터랙션 요소 (QR Code 출력, TOTP 타이머 및 복사 버튼)
- **여백 가이드:** 콘텐츠 간 격리는 최소 `space-y-6` 이상, PC 화면에서는 `gap-12` 이상의 넓은 여백을 유지하여 '여백의 미'를 극대화합니다.

## 4. 글래스모피즘 표준 클래스
카드 컴포넌트는 항상 아래의 속성이 조합된 형태를 유지합니다.
- `bg-white/60 dark:bg-space-card/50`
- `backdrop-blur-xl`
- `border border-white/20 dark:border-white/5`
- `shadow-xl shadow-black/5 dark:shadow-none`