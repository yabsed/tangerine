# Web

React와 Vite를 사용한다. 화면은 `src/features/`, 공통 API·UI는 `src/shared/`에 있다.

## 로컬 실행

```sh
cd web
npm ci
npm run dev
```

개발 서버는 `/api` 요청과 WebSocket을 `localhost:8000`으로 전달한다.
브라우저에서는 Vite가 표시한 주소의 `/tangerine/` 경로로 접속한다.
별도 API를 사용할 때는 `.env.example`을 참고한다. `VITE_*`에는 비밀 값을 넣지 않는다.

## 검증

```sh
npx tsc --noEmit
npm run build
```

운영 빌드에는 `VITE_API_ORIGIN`을 설정한다.
배포·Pages·환경 설정은 [운영 문서](../infra/README.md)를 참고한다.
