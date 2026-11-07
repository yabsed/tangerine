# Tangerine

웹과 API를 한 저장소에서 개발하고 배포한다.

| 서비스 | 주소 |
| --- | --- |
| 웹 | https://yabsed.github.io/tangerine/ |
| API | https://54-253-247-152.sslip.io |

```text
브라우저 ── HTTPS / WSS ── Lightsail
                           Caddy → FastAPI → MySQL
                                      │
                                      ├─ 이미지 업로드 → S3 이미지 버킷
                                      └─ DB 백업      → S3 비공개 버킷

브라우저 ── 이미지 다운로드 ── S3 이미지 버킷
```

## 읽는 순서

- [server/](server/README.md): FastAPI, 데이터 모델, 마이그레이션, 테스트
- [web/](web/readme.md): React 화면과 API 클라이언트
- [infra/](infra/README.md): 실행 구성, 배포, 검증, 백업
- [.github/workflows/](.github/workflows): 서버와 웹의 CI/CD

PR은 두 앱을 검사한다. `main`에 반영하면 변경된 서비스가 배포된다.
서버는 `server/`·`infra/`, 웹은 `web/` 변경을 기준으로 실행한다.
두 앱을 함께 바꾸는 기능도 한 브랜치와 PR에서 관리한다.

## 이전 이력

`23-5-team9-server`와 `23-5-team9-web`을 각각 한 번의 merge로 가져왔다.
원본 커밋의 SHA·작성자·부모 관계를 보존했다. 현재 파일은 이 저장소가 직접 관리한다.

```sh
git log --first-parent --oneline
git log archive/server/main
git log archive/web/main
```

원본 서버 작업 브랜치는 `archive/server/restore-direct-s3-images`에 보존했다.
과거 커밋은 당시 파일 경로를 사용한다. 현재 코드는 `server/`와 `web/`에 있다.
기존 저장소의 PR과 Actions 실행 기록은 해당 저장소에서 확인한다.
