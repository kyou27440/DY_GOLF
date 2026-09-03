# DY_GOLF 리비젼 자동 갱신 규칙

## 🔴 CRITICAL: 코드 수정 후 리비젼 갱신은 필수

**`g:\AI\04_DY_GOLF` 프로젝트에서 어떠한 코드 파일을 수정/생성/삭제하더라도,
반드시 아래 체크리스트를 완료한 후에 작업을 종료한다.**

---

## ✅ 리비젼 갱신 체크리스트 (모든 코드 수정 시 필수)

코드 수정이 완료되면 아래 4개 항목을 **반드시** 순서대로 업데이트한다.

### 1. `js/config.js` — 버전 및 Changelog
- `var APP_VERSION = 'vX.X.X';` — 패치 버전 +1
- `var APP_BUILD_TIME = 'YYYY-MM-DD HH:mm (ICT)';` — 현재 ICT 시각
- `var APP_CHANGELOG` 배열 최상단에 신규 항목 추가

### 2. `index.html` — 캐시 버스팅 (3곳 일괄 변경)
- 상단 `const VER = 'X.X.X_YYYYMMDD_HHmm';`
- 모든 CSS/JS `?v=X.X.X_YYYYMMDD_HHmm` 쿼리스트링
- 사이드바 `vX.X.X DY_GOLF (YYYY-MM-DD HH:mm ICT)`

### 3. `REVISION_LOG.md` — 변경 이력 기록
- `## 📜 버전별 변경 이력` 섹션 최상단에 신규 블록 추가

### 4. 올바른 파일 경로 확인 (실수 방지)
- 브라우저 로드 파일: **`js/pages/*.js`** (루트 `pages/*.js` 절대 아님)
- `index.html` 의 `src="js/pages/club.js"` 경로 기준으로 수정

---

## 📐 버전 넘버링 규칙

- 주요 기능 추가: Minor +1 (v1.4 → v1.5)
- 기능 개선/UI 변경: Patch +1 (v1.4.2 → v1.4.3)
- 버그 수정: Patch +1

---

## ⚡ 빠른 실행 스크립트

```powershell
cd g:\AI\04_DY_GOLF
.\update_revision.ps1
```

---

## 🚫 절대 하지 말 것

- `pages/*.js` (루트) 수정 — 브라우저가 읽지 않는 파일
- 코드만 수정하고 `index.html ?v=` 버전 미갱신 → 캐시로 반영 안 됨
- `REVISION_LOG.md` 업데이트 누락
- `js/config.js` APP_CHANGELOG 최상단 신규 항목 추가 누락