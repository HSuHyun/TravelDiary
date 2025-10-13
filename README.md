# TravelDiary

> **나만의 여행 일기장 & 일정 관리 웹앱**  
> 여행지, 일정, 메모, 사진을 한 곳에 기록하고 관리할 수 있는 **React 기반 다이어리 프로젝트**입니다.  
> 여행 후기를 타임라인 형식으로 정리하며, 추억을 시각적으로 기록할 수 있습니다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **개발 언어** | TypeScript |
| **프레임워크** | React (Vite 기반) |
| **UI 프레임워크** | TailwindCSS, Radix UI |
| **상태 관리** | React Hooks / Context / LocalStorage |
| **데이터 관리** | IndexedDB / LocalStorage (로컬 저장 기반) |
| **목적** | 여행 일지 + 일정 관리 + 사진 첨부형 다이어리 |

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **여행 일정 등록** | 날짜별 일정/방문지 추가 |
| **여행 메모** | 각 일정별 텍스트 메모 작성 |
| **사진 첨부** | 여행 사진을 일기 형태로 기록 |
| **로컬 데이터 저장** | 브라우저 LocalStorage/IndexedDB에 데이터 저장 |

---

## 폴더 구조

TravelDiary/  
 ┣ dist/                     # 빌드 결과물 (Vite build output)  
 ┣ node_modules/             # 의존성 패키지  
 ┣ public/                   # 정적 리소스 (favicon, manifest 등)  
 ┣ src/  
 ┃ ┣ assets/                 # 이미지, 아이콘 등 정적 리소스  
 ┃ ┣ App.css                 # 전역 스타일  
 ┃ ┣ App.tsx                 # 루트 컴포넌트  
 ┃ ┣ db.ts                   # 로컬 데이터베이스/스토리지 관련 로직  
 ┃ ┣ index.css               # 글로벌 CSS 초기화  
 ┃ ┣ main.tsx                # 엔트리 포인트 (React DOM 렌더링)  
 ┃ ┗ vite-env.d.ts           # Vite 환경 타입 정의  
 ┣ .gitattributes  
 ┣ .gitignore  
 ┣ eslint.config.js          # ESLint 설정  
 ┣ index.html                # HTML 템플릿  
 ┣ package.json              # 프로젝트 의존성 및 스크립트  
 ┣ package-lock.json  
 ┣ postcss.config.js         # PostCSS 설정  
 ┣ tailwind.config.js        # TailwindCSS 설정  
 ┣ tsconfig.json             # TypeScript 기본 설정  
 ┣ tsconfig.app.json         # 애플리케이션용 TS 설정  
 ┣ tsconfig.node.json        # Node 환경용 TS 설정  
 ┗ vite.config.ts            # Vite 빌드 설정  

---

## 실행 방법

```bash
# 1. 프로젝트 클론
git clone https://github.com/HSuHyun/TravelDiary.git

# 2. 의존성 설치
cd TravelDiary
npm install

# 3. 개발 서버 실행
npm run dev
```

서버 실행 후:
👉 http://localhost:5173
 (기본 포트)
 
---

## 향후 계획

- 클라우드 동기화 (Firebase / Supabase 연동)
- 지도 API 연결 (Google Maps / Kakao Map)
- 여행별 태그 & 필터 기능 강화
- 일정 공유 (공개 링크 / PDF 내보내기)
- 반응형 최적화 (모바일 전용 뷰)

---

## 개발자
HSuHyun
