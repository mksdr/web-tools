# 프로젝트 기본 원칙 (RULES.md)

## 1. 100% 로컬 환경
- **외부 CDN 사용을 절대 금지합니다.**
- 모든 오픈소스 JavaScript 라이브러리는 다운로드하여 `vendor/` 디렉토리에 위치시키고 로컬 경로로 참조합니다.
- Tailwind CSS 역시 CDN 링크를 사용하지 않으며, 로컬 Tailwind CLI를 통해 빌드된 단일 CSS 파일만 사용해야 합니다.

## 2. 라우팅 및 독립성
- 모든 도구 페이지(`*.html`)는 독립적으로 작동해야 하며, 외부 서버로 데이터를 전송하지 않는 순수 Client-side 로직으로만 구동되어야 합니다.
- **랜딩 페이지 회귀 보장:** 모든 서브 페이지 상단에는 메인 화면(`../index.html`)으로 즉시 돌아갈 수 있는 동일한 디자인의 'Home' 버튼이 무조건 포함되어야 합니다.

## 3. 기술 스택 제약
- **Framework-less:** React, Vue 등의 프레임워크를 사용하지 않고 순수 HTML, Tailwind CSS, 그리고 ECMAScript(Vanilla JS)로만 구현합니다.
- 테마 전환 및 상태 관리는 브라우저 내장 API(`localStorage`, `window.matchMedia`)만을 활용합니다.