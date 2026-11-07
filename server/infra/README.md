# 운영 배포

웹은 GitHub Pages, API와 WebSocket은 시드니 Lightsail 한 대에서 실행한다.
Caddy → FastAPI(worker 1개) → MySQL. 이미지는 전용 S3 버킷에서 브라우저에 직접 전달한다.
업로드는 인증된 FastAPI 요청으로 처리하고, API는 서명이 없는 HTTPS 이미지 URL을 반환한다.

| 항목 | 현재 설정 |
| --- | --- |
| 리전 | `ap-southeast-2` |
| Lightsail | `dangeun-server`, Ubuntu 24.04, `small_3_2` (2 GB, 월 $12) |
| 고정 IP | `dangeun-server-ip` |
| API | `https://54-253-247-152.sslip.io` |
| 웹 | `https://yabsed.github.io/23-5-team9-web/` |
| S3 이미지 | `dangeun-images-8c4e6a29`, `images/*` 공개 읽기 |
| S3 백업 | `dangeun-255235819297-sydney`, 비공개 |
| 서버 디렉터리 | `/opt/dangeun` |

임시 도메인은 IP를 가리키는 외부 DNS 서비스다. 운영 도메인이 생기면 교체한다.
Lightsail 요금 외 S3 저장·요청 비용은 별도다. 무료 플랜은 크레딧으로 사용량을 충당한다.

## 파일을 읽는 순서

- `compose.yaml`: 실행할 세 서비스와 영구 볼륨
- `Caddyfile`: HTTPS와 WebSocket 프록시
- `test.sh`: runner에서 단위 테스트 → DB 마이그레이션 → HTTP·WebSocket 검사
- `deliver.sh`: runner에서 설정 전달 → 서버 배포 호출 → 임시 자격 증명 삭제
- `deploy.sh`: 서버에서 이미지 받기 → DB 마이그레이션 → API 교체
- `smoke.py`: 공개 주소에서 로그인·권한·메시지 전달 확인
- `bootstrap.sh`: 최초 서버 설치
- `backup.sh`, `backup.py`: MySQL 덤프를 S3에 저장

참고한 [chess](https://github.com/yabsed/chess)의 명시적인 실행 순서와
[vlm-in-flash-jupyter](https://github.com/yabsed/vlm-in-flash-jupyter)의 단계 분리 방식을 따른다.
각 파일은 하나의 실행 위치와 역할을 갖고, 설정 묶음 사이에는 빈 줄을 둔다.
workflow는 `test → build → deploy` 순서와 권한·입력만 드러낸다.
동작 순서는 파일 위에서 아래로 읽고, 단계 사이는 빈 줄로 구분한다.

## GitHub 설정

`main` push 또는 수동 실행으로 `.github/workflows/deploy.yml`이 배포한다.
PR은 테스트와 이미지 빌드만 수행한다. 앱 CD에는 AWS 관리자 키를 사용하지 않는다.

| 종류 | 이름 | 내용 |
| --- | --- | --- |
| Secret | `SSH_PRIVATE_KEY` | 배포용 SSH 비밀키 |
| Secret | `SSH_KNOWN_HOSTS` | Lightsail API로 검증한 호스트 공개키 |
| Secret | `PRODUCTION_ENV` | `.env.example`을 채운 운영 설정 전체 |
| Secret | `SMOKE_PASSWORD` | 배포 검증용 계정 비밀번호 |
| Variable | `SSH_HOST` | 고정 IP |
| Variable | `API_ORIGIN` | 공개 HTTPS 주소 |

이미지 버킷명은 비밀이 아니며 `deploy.yml`의 `S3_IMAGE_BUCKET`에 기록한다.
배포 시 `PRODUCTION_ENV` 뒤에 이 설정을 추가한다. 기존 `S3_BUCKET`은 백업 전용으로 유지한다.
로컬 실행에는 별도 `S3_IMAGE_BUCKET`과 `AWS_DEFAULT_REGION`을 설정한다.
두 버킷명이 같으면 API 시작을 거부한다.

값은 `gh secret set NAME < private-file`로 입력한다. 명령 인자에 값을 직접 쓰지 않는다.
운영 설정은 SSH로 전달해 서버의 `.env`에 권한 `600`으로 보관한다.
`docker compose config`, `env`, 셸 `set -x`로 비밀 값을 출력하지 않는다.
이미지 빌드는 `carrot/`, `alembic.ini`, `infra/backup.py`만 복사한다.

GHCR 이미지는 Actions의 `GITHUB_TOKEN`으로 게시하고 읽는다.
서버의 임시 Docker 로그인 파일은 이미지 pull 직후 삭제한다.
Google OAuth는 두 설정값이 모두 있을 때만 로그인 화면에 나타난다.

## 최초 구성

AWS CLI의 현재 계정과 리전을 확인한다. 이 프로젝트의 허용 리전은 시드니다.
전용 SSH 공개키를 등록한 뒤 다음과 같이 생성했다.

```sh
aws lightsail create-instances \
  --region ap-southeast-2 \
  --instance-names dangeun-server \
  --availability-zone ap-southeast-2a \
  --blueprint-id ubuntu_24_04 \
  --bundle-id small_3_2 \
  --ip-address-type ipv4 \
  --key-pair-name dangeun-deploy \
  --user-data file://infra/bootstrap.sh

aws lightsail allocate-static-ip \
  --region ap-southeast-2 \
  --static-ip-name dangeun-server-ip

aws lightsail attach-static-ip \
  --region ap-southeast-2 \
  --static-ip-name dangeun-server-ip \
  --instance-name dangeun-server
```

포트는 SSH(22), HTTP(80), HTTPS(443)만 연다. DB와 API 포트는 외부에 열지 않는다.
SSH 비밀번호 인증은 사용하지 않는다. GitHub 호스팅 runner가 배포 키로 접속한다.

백업 버킷은 공개 접근 차단 4개 항목·SSE-S3·버전 관리를 유지하고 HTTPS만 허용한다.
이미지 버킷은 `BucketOwnerEnforced`로 ACL을 비활성화하고 SSE-S3 암호화를 사용한다.
`BlockPublicAcls`와 `IgnorePublicAcls`는 켜고, `BlockPublicPolicy`와
`RestrictPublicBuckets`만 끈다. 계정 전체의 공개 접근 설정은 변경하지 않는다.
`image-bucket-policy.json`은 HTTPS를 강제하고 `images/*`에만 익명 `s3:GetObject`를 허용한다.
익명 목록 조회·쓰기·삭제와 다른 경로의 읽기는 허용하지 않는다.
이미지에는 UUID 경로를 사용하고 원본 파일명·사용자 정보·사용자 지정 메타데이터를 넣지 않는다.
이미지 응답의 `Content-Type`과 `Cache-Control: public, max-age=86400`은 업로드 시 저장한다.

`dangeun-storage` IAM 사용자는 이미지 버킷 `images/*`와 백업 버킷 `backups/*`의
`s3:PutObject`, `s3:AbortMultipartUpload`만 허용한다. 이미지 조회에는 서버 AWS 권한을 사용하지 않는다.
Lightsail에는 EC2 instance profile이 없으므로 이 제한된 키를 `PRODUCTION_ENV`로 전달한다.
AWS 키·DB 자격 증명·토큰은 브라우저, 공개 파일, 로그에 전달하지 않는다.

`a26d11080002`는 전환 시 기존 이미지 레코드와 상품 이미지 ID를 한 번 초기화하고,
이에 연결된 프로필 URL 및 이전 API 파일 URL을 비운다. 외부 프로필 이미지, 계정, 상품은 유지한다.
이 초기화는 사용자 승인에 따른 것으로 되돌릴 수 없다. 옛 S3 객체와 백업은 비공개 버킷에 남는다.
마이그레이션 중에는 API를 멈춰 이전 버전이 이미지 참조를 다시 쓰는 일을 방지한다.

## 검증과 복구

CI는 빈 MySQL 8.4에 `alembic upgrade head`를 실행한다.
실제 배포 뒤에는 HTTPS, CORS, 회원가입, 로그인, 방 접근 거부, WebSocket 전달,
HTTP 메시지의 실시간 알림, 메시지 재조회, 상품·프로필 이미지 업로드까지 검사한다.
이미지는 인증 정보가 없는 별도 HTTP 클라이언트가 S3에서 리다이렉트 없이 받는지 확인한다.
URL에 서명이 없고 옛 `/api/image/{id}/file` 경로는 404이며 익명 버킷 목록 조회는 403이어야 한다.
`deploy-a`, `deploy-b`, `deploy-outsider` 계정을 `example.com` 주소로 재사용한다.
이 계정들은 배포 검증용이며 실제 사용자 계정으로 쓰지 않는다.

API 교체 시 WebSocket 연결이 끊기면 브라우저가 재접속하고 HTTP로 내역을 재조회한다.
현재는 대화 내역을 페이지 단위로 모두 읽는다. 내역이 커지면 화면의 이전 메시지
페이지와 재연결 커서를 분리한다. 메모리 연결 관리자를 쓰므로 worker는 하나로 유지한다.

이전 이미지로 돌아갈 때는 서버에서 실행한다. DB 스키마는 되돌리지 않는다.
단, 공개 이미지 버킷 전환 이전 버전으로 되돌리면 저장소 설정과 권한도 별도로 복원해야 한다.

```sh
cd /opt/dangeun
export API_IMAGE=$(cat previous-image)
docker compose up -d --no-deps --wait api
```

MySQL과 인증서는 각각 영구 볼륨에 남는다. `docker compose down -v`를 실행하지 않는다.
매일 02:15 KST에 DB를 S3 `backups/`로 백업하고 30일 보관한다.
수동 백업은 `bash /opt/dangeun/backup.sh`, 결과는 `backup.log`에서 확인한다.
복원에는 별도 관리자 권한으로 덤프를 받아 빈 MySQL에 import한 뒤 무결성을 검증한다.

마이그레이션 `c6a3626040c7`은 삭제된 과거 체인 대신 기존 초기 스키마
`18ad2967df96`을 부모로 연결했다. 새 DB에서 전체 이력을 검증하며,
이미 운영 중인 다른 DB를 이 배포에 연결하기 전에는 해당 DB의 revision을 확인한다.
