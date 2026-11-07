# GitHub Pages 배포

`main` push → 타입 검사 → Vite build → Pages artifact → Pages 배포.
PR에서는 타입 검사와 빌드까지만 수행한다.

- 공개 주소: https://yabsed.github.io/23-5-team9-web/
- Settings → Pages → Source: GitHub Actions
- Repository Variable `VITE_API_ORIGIN`: API의 HTTPS origin

`VITE_*`는 브라우저에 공개된다. 비밀 값은 넣지 않는다.
WebSocket 주소와 Google 로그인 주소도 같은 API origin에서 만든다.
Vite base와 BrowserRouter basename은 `/23-5-team9-web/`를 사용한다.
`404.html`은 직접 접근한 React 경로를 렌더링한다. Pages는 이때 HTTP 404를 반환한다.

채팅은 WebSocket 알림을 받고 HTTP로 저장된 메시지를 읽는다.
배포로 연결이 끊기면 최대 30초 간격으로 재연결하고 내역을 다시 읽는다.
메시지 전송은 HTTP 응답으로 성공을 확인하며, 서버는 결과를 WebSocket에도 전달한다.

학습·데모용 배포다. 실제 상거래 운영에는 GitHub Pages의 사용 제한을 검토하고
프런트 호스팅을 변경한다.

확인한 동작: 두 브라우저에서 로그인·WSS 메시지 전달, 네트워크 복구 후 내역 조회,
채팅 주소 직접 접근과 새로고침. Google 로그인은 서버에 OAuth 설정을 넣은 뒤 표시된다.
