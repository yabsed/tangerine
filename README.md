# Dangeun

| 서비스 | 배포 주소 |
| --- | --- |
| 웹 | https://yabsed.github.io/23-5-team9-web/ |
| API | https://54-253-247-152.sslip.io |

```text
GitHub Pages → 브라우저 → HTTPS / WSS → Lightsail
                                        Caddy
                                        FastAPI (worker 1)
                                        MySQL (영구 볼륨)
                                          ↓
                                        S3 (이미지·DB 백업)
```

각 저장소의 `main` push가 해당 서비스만 배포한다. 루트 저장소에는 통합 CD를 두지 않는다.

- [서버 운영·배포](23-5-team9-server/infra/README.md)
- [웹 배포](23-5-team9-web/DEPLOYMENT.md)

시드니 리전의 Lightsail 2 GB 한 대를 사용한다. API 주소는 첫 배포용 임시 도메인이다.
운영 비밀 값은 서버 저장소의 GitHub Secrets로 전달한다. `VITE_API_ORIGIN`은 공개 설정이다.
