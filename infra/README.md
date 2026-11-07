# 실행과 운영

웹은 GitHub Pages, API와 MySQL은 시드니 Lightsail에서 실행한다.
2월 코드 복원과 현재 환경 조정은 별도 커밋이다. 기준은 [루트 README](../README.md)에 기록한다.

| 항목 | 설정 |
| --- | --- |
| 저장소 | `yabsed/tangerine`, `main` |
| 웹 | `https://yabsed.github.io/tangerine/` |
| API | `https://54-253-247-152.sslip.io` |
| Lightsail | `dangeun-server`, `ap-southeast-2` |
| 서버 경로 / Compose 이름 | `/opt/dangeun` / `dangeun` |
| 전시 DB | `tangerine_exhibit` |
| 이미지 버킷 | `dangeun-images-8c4e6a29` |
| 비공개 백업 버킷 | `dangeun-255235819297-sydney` |

## 실행 순서

| 파일 | 실행 위치와 역할 |
| --- | --- |
| `Dockerfile` | runner: 원본 Python 의존성으로 API 빌드 |
| `test.sh`, `smoke.py` | CI: 새 DB 마이그레이션 → API 실행 → HTTP 검사 |
| `deliver.sh` | runner: 설정 전달 → 배포 호출 |
| `deploy.sh` | Lightsail: 이미지 받기 → 마이그레이션 → API 교체 |
| `init.sql` | 원본 상품 폼의 `category_id = 1` 참조값 |
| `compose.yaml`, `Caddyfile` | MySQL·FastAPI·HTTPS 실행 |
| `backup.sh`, `backup.py` | MySQL 덤프 → 비공개 S3 업로드 |
| `bootstrap.sh` | 최초 Docker·swap·백업 cron 설치 |

CI에서만 임시 계정과 채팅을 만든다. 운영 배포 검사는 조회만 한다.
원본의 회원가입·로그인·온보딩·HTTP 채팅을 확인하며, 새 WebSocket 동작을 요구하지 않는다.
웹은 원본 잠금 파일로 `npm ci`와 `npm run build`를 실행한다.

PR에서는 두 앱을 검사한다. `main` push는 변경된 서비스만 배포한다.
수동 실행:

```sh
gh workflow run server.yml --repo yabsed/tangerine --ref main
gh workflow run web.yml --repo yabsed/tangerine --ref main
```

## 설정

Pages의 Source는 GitHub Actions다. 환경은 `production`과 `github-pages`다.

| 종류 | 이름 | 내용 |
| --- | --- | --- |
| Variable | `API_ORIGIN` | API HTTPS 주소 |
| Variable | `SSH_HOST` | Lightsail 고정 IP |
| Secret | `SSH_PRIVATE_KEY` | 배포 SSH 비밀키 |
| Secret | `SSH_KNOWN_HOSTS` | 확인된 서버 호스트 공개키 |
| Secret | `PRODUCTION_ENV` | `.env.example`을 채운 운영 설정 |

`VITE_API_ORIGIN`은 공개되는 웹 빌드 설정이다. 비밀 값을 넣지 않는다.
`FRONTEND_URL`은 로그인 복귀 주소다. Google OAuth는 현재 주소에 맞는 별도 설정이 필요하다.
이미지 버킷명은 `server.yml`에서 전달한다. 기존 IAM의 `images/*` 업로드 권한을 사용한다.

운영 `.env`는 권한 `600`이며 SSH·registry 임시 인증 파일은 사용 후 삭제한다.
`docker compose config`, `env`, `set -x`로 비밀 값을 출력하지 않는다.
Docker 컨텍스트는 `.dockerignore`로 API 코드와 백업 업로더만 허용한다.

## 데이터와 복구

전시 DB는 원본 마이그레이션의 `7fa611714908`까지 적용한다.
지역 목록은 원본 마이그레이션에 포함돼 있다. `init.sql`은 카테고리 참조값 하나만 넣는다.
계정·상품·경매·채팅·이미지 데이터는 만들지 않는다.

11월 DB `carrot`과 기존 MySQL·인증서 볼륨은 보존한다.
전환 직전 설정과 이미지 기록은 서버 `/opt/dangeun/before-exhibit/`에 비공개로 보관한다.
전시 DB를 이전 앱에 연결하지 않는다. 복구할 때는 이전 이미지와 이전 Compose 설정을 함께 복원한다.

```sh
cd /opt/dangeun
cp before-exhibit/{.env,compose.yaml,Caddyfile,deploy.sh,backup.sh,current-image} .
export API_IMAGE=$(cat current-image)
docker compose up -d --no-deps --wait api
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
```

전시 전환 이후 `backup.sh`는 `tangerine_exhibit`를 매일 02:15 KST에 백업한다.
수동 실행은 `bash /opt/dangeun/backup.sh`다. 백업은 S3에서 30일 보관한다.
`docker compose down -v`는 영구 볼륨을 삭제하므로 사용하지 않는다.

## 원본 동작

브라우저는 HTTP 폴링으로 채팅을 갱신한다. API의 정상 응답은 `GET /`로 확인한다.
GitHub Pages의 `404.html`은 직접 접근한 React 경로를 렌더링하며 HTTP 상태는 404다.
이미지는 원본처럼 업로드한 파일과 Content-Type을 그대로 S3에 저장한다.
공개 읽기는 이미지 버킷의 `images/*`에만 허용하며, 백업 버킷은 비공개다.
