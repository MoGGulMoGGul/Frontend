# 모꿀모꿀 (MoGGulMoGGul) - Frontend
![header](https://capsule-render.vercel.app/api?type=cylinder&color=EAC149&height=130&section=header&text=MOGGUL-MOGGUL%20Frontend&fontSize=50&animation=scaleIn&fontColor=FFF)

<p align="center">
  <!-- Framework -->
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <br/>

  <!-- Styling -->
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/clsx-239120?style=for-the-badge"/>
  <br/>

  <!-- State & Data -->
  <img src="https://img.shields.io/badge/Zustand-7A5A48?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white"/>

  <!-- WebSocket -->
  <img src="https://img.shields.io/badge/StompJS-6DB33F?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/SockJS-CC0000?style=for-the-badge"/>
  <br/>

  <!-- Infra -->
  <img src="https://img.shields.io/badge/Amazon%20S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white"/>
  <img src="https://img.shields.io/badge/Amazon%20CloudFront-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/>

  <!-- Tools -->
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white"/>
</p>

---


## 프로젝트 개요
AI 서버를 통해 생성된 꿀팁(온라인 콘텐츠 요약 정보)을 사용자들이 공유하고 관리할 수 있는 모꿀모꿀 서비스의 웹 프론트엔드입니다. 사용자 인증부터 꿀팁 생성, 보관, 그룹 공유 및 실시간 랭킹 확인까지 다양한 기능을 제공합니다.

---
## 팀원 소개
| **이름** | **역할** | **GitHub** |
|--------|---------------|------------------------------|
| 정혜지   | 프론트엔드 / 디자인     | https://github.com/heartggs  |
| 구강현   | 백엔드 / 배포 / AI | https://github.com/GangHyoun |
| 송보민   | 백엔드 / AI       | https://github.com/Songbomin |


---

## 프로젝트 구성

### 주요 기능
- **사용자 인증**: JWT를 이용한 회원가입, 로그인, 로그아웃 기능 및 세션 관리
- **꿀팁(Tip) 관리**: AI를 통해 요약된 URL 콘텐츠(꿀팁)를 생성, 등록, 수정, 삭제 및 조회
- **개인/그룹 보관함**: 생성된 꿀팁을 육각형 그리드 UI를 통해 개인 또는 그룹 보관함에 저장 및 관리
- **소셜 기능**: 다른 사용자를 팔로우/언팔로우하고 팔로워/팔로잉 목록 확인
- **그룹 기능**: 그룹을 생성하고 다른 사용자를 초대하여 그룹 내에서 꿀팁 공유
- **실시간 기능**: WebSocket(STOMP)을 통해 새로운 꿀팁, 알림, 조회수 랭킹 등을 실시간으로 수신 및 표시
- **검색 및 랭킹**: 꿀팁을 검색하고 북마크 기반의 주간 랭킹 조회


## 툴체인 & 프레임워크

### 프레임워크

| 분류 | 사용 기술 | 설명 |
|---|---|---|
| **프론트엔드 프레임워크** | Next.js, React | App Router 기반의 UI/UX 구현 및 서버 사이드 렌더링(SSR) 최적화 |
| **언어** | TypeScript | 정적 타이핑을 통해 코드의 안정성과 생산성 향상 |
| **상태 관리** | Zustand | 간결한 API를 제공하는 가볍고 빠른 상태 관리 라이브러리 |
| **데이터 페칭** | Axios | 서버 상태 관리, 캐싱, 비동기 데이터 통신을 효율적으로 처리 |
| **스타일링** | Tailwind CSS | 유틸리티-우선 CSS 프레임워크를 사용하여 신속하게 UI 개발 |
| **실시간 통신** | StompJS | WebSocket 기반 실시간 메시징 프로토콜을 구현하여 서버와 통신 |

### 툴체인

| 분류 | 사용 기술 | 설명 |
|---|---|---|
| **IDE** | Visual Studio Code | TypeScript 및 React 개발에 최적화된 통합 개발 환경 |
| **패키지 매니저** | npm / yarn | 프로젝트 빌드 및 의존성 관리 자동화 도구 |
| **버전 관리** | Git + GitHub | 소스 코드 버전 관리 및 협업을 위한 플랫폼 |
| **배포/호스팅** | AWS S3 & CloudFront | GitHub Actions를 통한 정적 사이트 CI/CD 자동화 |
| **인프라**| AWS S3, CloudFront | 정적 에셋 저장 및 CDN을 통한 전송 속도 최적화 |
| **런타임 환경** | Node.js (v18.17+) | 프론트엔드 애플리케이션의 JavaScript 런타임 환경 |

---

## 프로젝트 프로그램 설치방법 및 실행 방법

### 사전 요구사항
- **Node.js**: v18.17 이상
- **npm** 또는 **yarn**
- **실행 중인 MogulMogul 백엔드 서버**

### 설치 과정
1. **프로젝트 클론**
   ```bash
   git clone [https://github.com/MoGGulMoGGul/Frontend.git](https://github.com/MoGGulMoGGul/Frontend.git)
   cd Frontend
   ```

2. 패키지 설치
    ```
    npm install
    # 또는
    # yarn install
    ```

3. .env.local 파일 설정
    ```
    # 백엔드 API 서버 URL
    NEXT_PUBLIC_API_URL=[http://your-backend-api-server.com](http://your-backend-api-server.com)
    ```

4. 개발 서버 실행
    ```
    npm run dev
    # 또는
    # yarn dev
    ```

---
## 프로젝트 URL
- **Main**: https://github.com/MoGGulMoGGul
- **FrontEnd**: https://github.com/MoGGulMoGGul/Frontend
- **BackEnd**: https://github.com/MoGGulMoGGul/Backend
- **AI**: https://github.com/MoGGulMoGGul/AI/tree/main

