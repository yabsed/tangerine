"""Exercise HTTP auth, room permissions, WebSocket delivery, and replay.

SMOKE_PASSWORD is a GitHub Secret. The three smoke accounts are reused.
No tokens, passwords, response bodies, or authorization headers are logged.
"""
import argparse
import asyncio
import base64
import json
import os
import sys
from contextlib import AsyncExitStack

import httpx
from websockets.asyncio.client import connect
from websockets.exceptions import ConnectionClosed, InvalidStatus


async def run(args):
    password = os.environ["SMOKE_PASSWORD"]
    ws_origin = args.url.replace("https://", "wss://").replace("http://", "ws://")

    async with httpx.AsyncClient(base_url=args.url, timeout=30) as http:
        response = await http.get("/api/health", headers={"Origin": args.origin})
        response.raise_for_status()
        assert response.headers["access-control-allow-origin"] == args.origin
        print("HTTP health and CORS passed.")

        response = await http.get("/api/region/search", params={"query": "", "limit": 1})
        response.raise_for_status()
        region_id = response.json()[0]["id"]

        users = []
        for name in ("a", "b", "outsider"):
            credentials = {"email": f"deploy-{name}@example.com", "password": password}
            response = await http.post("/api/auth/tokens", json=credentials)
            if response.status_code != 200:
                response = await http.post("/api/user/", json=credentials)
                response.raise_for_status()
                response = await http.post("/api/auth/tokens", json=credentials)
            response.raise_for_status()
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            response = await http.get("/api/user/me", headers=headers)
            response.raise_for_status()
            user = response.json()
            if user["status"] != "active":
                response = await http.post(
                    "/api/user/me/onboard", headers=headers,
                    json={"nickname": f"배포확인-{name}", "region_id": region_id},
                )
                response.raise_for_status()
            users.append({"id": user["id"], "token": token, "headers": headers})
        alice, bob, outsider = users
        print("Signup, login, and onboarding passed.")

        response = await http.post(
            "/api/chat/rooms", params={"opponent_id": bob["id"]}, headers=alice["headers"],
        )
        response.raise_for_status()
        room = response.json()["id"]
        url = f"{ws_origin}/api/chat/ws/{room}"

        try:
            async with connect(url, origin="https://untrusted.example"):
                raise AssertionError("Untrusted origin accepted")
        except InvalidStatus as error:
            assert error.response.status_code == 403

        for token in ("invalid-token", outsider["token"]):
            async with connect(url, origin=args.origin) as socket:
                await socket.send(json.dumps({"token": token}))
                try:
                    await asyncio.wait_for(socket.recv(), 10)
                    raise AssertionError("Unauthorized socket accepted")
                except ConnectionClosed as error:
                    assert error.rcvd.code == 4003
        print("WebSocket origin, token, and room permissions passed.")

        async with AsyncExitStack() as stack:
            first = await stack.enter_async_context(connect(url, origin=args.origin))
            second = await stack.enter_async_context(connect(url, origin=args.origin))
            await first.send(json.dumps({"token": alice["token"]}))
            await second.send(json.dumps({"token": bob["token"]}))
            assert json.loads(await asyncio.wait_for(first.recv(), 10))["type"] == "ready"
            assert json.loads(await asyncio.wait_for(second.recv(), 10))["type"] == "ready"

            await first.send(json.dumps({"content": "배포 확인: WebSocket"}))
            sent = json.loads(await asyncio.wait_for(first.recv(), 10))
            received = json.loads(await asyncio.wait_for(second.recv(), 10))
            assert sent["id"] == received["id"]

            response = await http.post(
                f"/api/chat/rooms/{room}/messages", headers=alice["headers"],
                json={"content": "배포 확인: HTTP → WebSocket"},
            )
            response.raise_for_status()
            received = json.loads(await asyncio.wait_for(second.recv(), 10))
            assert received["id"] == response.json()["id"]

        response = await http.get(
            f"/api/chat/rooms/{room}/messages", headers=bob["headers"],
            params={"last_id": sent["id"]},
        )
        response.raise_for_status()
        assert received["id"] in [message["id"] for message in response.json()]
        print("WebSocket delivery, HTTP broadcast, and replay passed.")

        if args.images:
            png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jhtkAAAAASUVORK5CYII=")
            response = await http.post(
                "/api/image/product", headers=alice["headers"],
                files={"file": ("smoke.png", png, "image/png")},
            )
            response.raise_for_status()
            response = await http.get(response.json()["image_url"])
            response.raise_for_status()
            assert response.content == png
            print("Private S3 image upload and API delivery passed.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("origin")
    parser.add_argument("--images", action="store_true")
    args = parser.parse_args()
    try:
        asyncio.run(run(args))
    except Exception as error:
        print(f"Smoke test failed ({type(error).__name__}). No credentials logged.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
