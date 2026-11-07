# 운영

웹은 GitHub Pages, API와 WebSocket은 시드니 Lightsail에서 실행한다.
이미지는 인증된 API로 업로드하고, 브라우저가 서명 없는 S3 URL로 직접 받는다.

| 항목 | 설정 |
| --- | --- |
| 저장소 | `yabsed/tangerine`, 기본 브랜치 `main` |
| 웹 | `https://yabsed.github.io/tangerine/` |
| API | `https://54-253-247-152.sslip.io` |
| Lightsail | `dangeun-server`, `ap-southeast-2` |
| 서버 디렉터리 | `/opt/dangeun` |
| Compose 프로젝트 | `dangeun` |
| 이미지 버킷 | `dangeun-images-8c4e6a29` |
| 비공개 백업 버킷 | `dangeun-255235819297-sydney` |

Compose 이름과 서버 디렉터리는 기존 DB·인증서 볼륨 및 백업 cron을 이어 사용한다.
API 주소는 IP를 가리키는 임시 도메인이다.

## 파일과 실행 위치

| 파일 | 실행 위치와 역할 |
| --- | --- |
| `Dockerfile` | runner: API 이미지 빌드 |
| `test.sh` | runner: 단위 테스트 → DB 마이그레이션 → HTTP·WebSocket 검사 |
| `deliver.sh` | runner: 설정 전달 → 서버 배포 호출 |
| `deploy.sh` | Lightsail: 이미지 받기 → DB 마이그레이션 → API 교체 |
| `compose.yaml`, `Caddyfile` | Lightsail: MySQL·FastAPI·HTTPS 실행 구성 |
| `smoke.py` | runner 또는 로컬: 공개 API의 로그인·채팅·이미지 검사 |
| `backup.sh`, `backup.py` | Lightsail: MySQL 덤프 → 비공개 S3 업로드 |
| `bootstrap.sh` | 최초 서버 설치: Docker, swap, 백업 cron |
| `image-bucket-policy.json` | 이미지 버킷의 공개 읽기 범위와 HTTPS 정책 |

각 스크립트는 위에서 아래로 실행한다. 설정 묶음과 실행 단계는 빈 줄로 구분한다.

## GitHub Actions

루트의 두 workflow가 같은 저장소에서 동작한다.

- `server.yml`: 테스트 → 컨테이너 빌드 → Lightsail 배포 → 공개 API 검사
- `web.yml`: 타입 검사 → Vite 빌드 → GitHub Pages 배포

PR에서는 두 앱을 검사하고 배포하지 않는다.
`main` push는 각 앱과 해당 workflow의 경로 변경으로 실행한다.
`infra/`와 `.dockerignore` 변경은 서버 배포에 포함한다.
서버와 웹은 독립적으로 배포하므로 API 변경은 이전 웹과도 호환되도록 나누어 반영한다.

수동 재배포:

```sh
gh workflow run server.yml --repo yabsed/tangerine --ref main
gh workflow run web.yml --repo yabsed/tangerine --ref main
```

## 저장소 설정

Pages의 Source는 GitHub Actions다. 배포 환경은 `production`과 `github-pages`다.
기본 토큰 권한은 읽기이며, 이미지 게시와 Pages 배포 job에만 쓰기 권한을 부여한다.

| 종류 | 이름 | 내용 |
| --- | --- | --- |
| Variable | `API_ORIGIN` | API HTTPS origin; 두 workflow가 함께 사용 |
| Variable | `SSH_HOST` | Lightsail 고정 IP |
| Secret | `SSH_PRIVATE_KEY` | 배포용 SSH 비밀키 |
| Secret | `SSH_KNOWN_HOSTS` | AWS에서 확인한 서버 호스트 공개키 |
| Secret | `PRODUCTION_ENV` | `.env.example`을 채운 운영 설정 |
| Secret | `SMOKE_PASSWORD` | 배포 검증 계정 비밀번호 |

`VITE_API_ORIGIN`은 웹 빌드 때 `API_ORIGIN`에서 설정된다. `VITE_*` 값은 공개된다.
이미지 버킷명은 `server.yml`의 `S3_IMAGE_BUCKET`에 기록하고 운영 환경 파일에 추가한다.
`FRONTEND_URL`은 로그인 후 돌아갈 웹 주소다. Vite base는 `/tangerine/`를 사용한다.

비밀 값은 보호된 파일이나 stdin으로 `gh secret set`에 전달한다.
서버 `.env`는 권한 `600`으로 보관하고, 임시 SSH·GHCR 인증 파일은 사용 후 삭제한다.
`docker compose config`, `env`, `set -x`로 운영 값을 출력하지 않는다.
Docker 빌드 컨텍스트는 루트이며 `.dockerignore`가 API 소스와 백업 코드만 허용한다.

## 실행과 데이터

Caddy만 80·443 포트를 공개한다. API와 MySQL은 Compose 내부 네트워크를 사용한다.
채팅 연결은 메모리에서 관리하므로 API worker는 하나다.
API 교체 중 끊긴 WebSocket은 웹이 재접속하고 HTTP로 메시지 내역을 다시 읽는다.
Pages의 `404.html`은 React 직접 경로를 렌더링하며, 이때 HTTP 상태는 404다.

이미지 버킷은 ACL을 끄고 `images/*`의 HTTPS 읽기만 공개한다.
파일 경로에는 UUID를 쓰며 원본 파일명과 사용자 지정 메타데이터를 저장하지 않는다.
백업 버킷은 공개 접근 차단 네 항목과 버전 관리를 유지한다.
서버 IAM 사용자는 새 이미지 경로와 비공개 백업 경로의 업로드 권한만 가진다.

배포는 DB 마이그레이션 중 API 쓰기를 멈춘다.
기존 `a26d11080002`의 이미지 참조 초기화는 적용된 DB에서 다시 실행되지 않는다.
모노레포 이전은 DB를 초기화하지 않는다.

## 검증과 복구

CI는 빈 MySQL에서 전체 마이그레이션과 HTTP·WebSocket 검사를 실행한다.
배포 후에는 상품·프로필 이미지 업로드와 익명 S3 직접 다운로드도 검사한다.
`deploy-tangerine-a`, `deploy-tangerine-b`, `deploy-tangerine-outsider`의
`example.com` 계정은 검증 전용이다. 기존 저장소의 검증 계정과 분리해 사용한다.

이전 API 이미지로 되돌릴 때는 서버에서 실행한다. DB 스키마는 되돌리지 않는다.

```sh
cd /opt/dangeun
export API_IMAGE=$(cat previous-image)
docker compose up -d --no-deps --wait api
```

MySQL과 인증서는 영구 볼륨에 남는다. `docker compose down -v`는 데이터를 삭제한다.
매일 02:15 KST에 DB를 S3 `backups/`로 백업하고 30일 보관한다.
수동 백업은 `bash /opt/dangeun/backup.sh`, 결과는 `backup.log`에서 확인한다.
복원에는 별도 관리자 권한으로 덤프를 받아 빈 MySQL에 import한 뒤 무결성을 검증한다.
