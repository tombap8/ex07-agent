# 개발 가이드 및 구현 규격서 (dev.md)
# 나는 10년차 시니어 프론트엔드 개발자다.

이 문서는 프로젝트 개발 시 준수해야 할 기술적 설계 원칙, 코딩 컨벤션 및 구현 규격을 정의합니다. 새로운 기능을 추가하거나 코드를 리팩토링할 때 이 문서를 기준으로 개발합니다.

---

## 🛠️ 기술 스택 및 구조 설계 (Tech Stack & Architecture)

- **Core:** Pure Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3.
  - 외부 프레임워크나 외부 패키지 라이브러리(React, Vue, jQuery 등)의 의존성 없이 가볍고 고성능으로 작동하는 단일 페이지 애플리케이션(SPA) 구조를 고수합니다.
- **의존성 배제:** CSS 및 JS 파일은 CDN 의존을 최소화하며, 아이콘 등은 인라인 SVG 형식을 취하여 네트워크 지연 요소를 완전 배제합니다.

---

## 🔒 보안 및 연산 엔진 구현 지침 (Security & Calculator Logic)

### 1. 안전한 수식 평가 (Safe Math Evaluation)
- 사용자로부터 입력된 수식을 평가할 때 원시 `eval()` 사용을 절대 금지합니다.
- 수식 문자열을 실행하기 전, 반드시 허용된 산술 문자 및 연산자(`[0-9.+\-*/\s()]`)만 포함되어 있는지 정규식을 통해 엄격히 필터링해야 합니다.
  ```javascript
  const mathPattern = /^[0-9.+\-*/\s()]+$/;
  if (!mathPattern.test(expression)) {
    throw new Error('Invalid symbols');
  }
  ```
- 평가는 캡슐화된 `new Function` 스코프 내에서 수행하여 전역 컨텍스트 오염 및 XSS 인젝션을 방지합니다.

### 2. 예외 처리 및 수치 정밀도 보정
- 0으로 나누기(`Division by zero`), 무한 연산, 잘못된 수식 입력 시 화면에 단순 오동작이나 크래시가 아닌 `Error`를 반환하도록 `try-catch` 구조를 상시 배치합니다.
- 자바스크립트의 부동 소수점 오차(예: `0.1 + 0.2 = 0.30000000000000004`)를 방지하기 위해, 소수점을 포함하는 연산 결과물은 최대 소수점 10자리 내외에서 `toFixed()` 처리 후 자릿수 보정 함수를 거쳐 출력합니다.

---

## 💾 상태 및 데이터 영속성 규격 (State & LocalStorage)

- **테마 상태 저장:** 
  - 키: `aura-calc-theme`
  - 값: `dark` | `light`
  - 로드 시 `document.body`의 `data-theme` 어트리뷰트에 바인딩하여 CSS 변수와 연동합니다.
- **계산 기록 저장:**
  - 키: `aura-calc-history`
  - 값: JSON Array `[{ formula: String, result: String }]`
  - 최대 저장 개수는 50개로 제한하며, 용량 임계치 및 성능 저하를 방지하기 위해 새로운 기록이 생성될 시 큐(Queue) 형태로 관리합니다.

---

## ⌨️ 접근성 및 입력 처리 (Accessibility & Input Handler)

- **이중 입력 연동:** 모든 연산 버튼 클릭 이벤트 리스너와 동치 관계를 가지는 `keydown` 키보드 리스너를 연동합니다.
- **이벤트 전파 제어:** 브라우저 기본 단축키(예: 백스페이스를 눌렀을 때 뒤로 가기, 슬래시`/`를 눌렀을 때 빠른 검색 등)와 충돌을 피하기 위해 계산기 포커스 시 `e.preventDefault()`를 선별 수행합니다.
- **접근성(A11y):** 디스플레이 영역에 `aria-live="polite"` 속성을 부여하고, 각 조작 요소에 `aria-label`을 지정하여 스크린 리더 환경에 대비합니다.
