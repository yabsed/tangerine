# Tangerine

2026년 2월에 완성한 프로젝트를 당시 화면과 동작으로 실행한다.

| 항목 | 주소 / 기준 |
| --- | --- |
| 웹 | https://yabsed.github.io/tangerine/ |
| API | https://54-253-247-152.sslip.io |
| 서버 원본 | `c4b9922bec6bd43851c59e068731ba2e712f9498` · 2026-01-29 |
| 웹 원본 | `198c3665047235665b963fa049534a729951d65e` · 2026-02-07 |

계정·상품·경매·채팅은 빈 상태로 시작한다. 원본 데이터나 전시용 샘플을 넣지 않는다.
지역 목록과 상품 폼이 요구하는 카테고리 값만 초기화한다.

## 읽는 순서

- [server/](server/README.md): 당시 FastAPI 코드와 마이그레이션
- [web/](web/readme.md): 당시 React 코드
- [infra/](infra/README.md): 현재 환경에서 실행·배포·검증·백업
- [.github/workflows/](.github/workflows): 서버와 웹의 자동 실행

웹 채팅은 원본의 HTTP 폴링을 사용한다. 서버 원본의 WebSocket 코드도 보존한다.
이미지는 API로 업로드하고 S3에서 직접 받는다. 형식 변환이나 별도 용량 제한을 추가하지 않는다.

## 원본과 실행 환경

`4f640b3`은 두 앱의 전체 Git 트리가 각각의 기준 커밋과 일치하는 복원 커밋이다.
그다음 커밋에서 현재 환경에 필요한 부분만 조정한다.

| 위치 | 조정 내용 |
| --- | --- |
| 서버 이미지 서비스 | 현재 S3 버킷·리전·허용된 `images/` 경로 연결 |
| 서버 마이그레이션 | 저장소에 없는 부모 revision을 실제 초기 revision에 연결 |
| 웹 API 설정 | 현재 API 주소를 빌드 환경에서 전달 |
| Vite 설정 | `/tangerine/` 경로와 로컬 API 연결 |
| 배포 파일 | 루트 `infra/`와 workflow로 일원화 |

화면, 채팅 방식, 상품·경매·회원 로직, 의존성 잠금 파일은 원본을 사용한다.
원본의 응답 후 DB 커밋 동작도 유지한다. Google 로그인은 별도 OAuth 설정이 있어야 동작한다.

```sh
# 앱 코드에서 원본 복원 이후 달라진 부분
git diff 4f640b3 -- server/carrot web/src web/vite.config.js

# 큰 변화만 읽기
git log --first-parent --oneline
```

두 원본 저장소의 이력은 import merge와 `archive/server/*`, `archive/web/*` 태그로 남아 있다.
11월 배포본은 `archive/before-february-exhibit`에 보존한다.
