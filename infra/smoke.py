"""Read-only production checks; account and chat checks run only in CI."""
import argparse
import os
import sys
import time

import httpx


def check_accounts(api):
    response = api.get("/api/region/search", params={"query": "", "limit": 1})
    response.raise_for_status()
    region_id = response.json()[0]["id"]

    users = []
    for name in ("a", "b"):
        credentials = {
            "email": f"ci-exhibit-{name}@example.com",
            "password": os.environ["SMOKE_PASSWORD"],
        }
        response = api.post("/api/user/", json=credentials)
        response.raise_for_status()

        response = api.post("/api/auth/tokens", json=credentials)
        response.raise_for_status()
        headers = {"Authorization": f"Bearer {response.json()['access_token']}"}

        response = api.post(
            "/api/user/me/onboard", headers=headers,
            json={"nickname": f"CI-{name}", "region_id": region_id},
        )
        response.raise_for_status()
        # The original dependency commits after sending the response.
        for _ in range(20):
            response = api.get("/api/user/me", headers=headers)
            response.raise_for_status()
            if response.json()["status"] == "active":
                break
            time.sleep(0.1)
        assert response.json()["status"] == "active"
        users.append({"id": response.json()["id"], "headers": headers})
    print("Signup, login, and onboarding passed.")

    alice, bob = users
    response = api.post(
        "/api/chat/rooms", params={"opponent_id": bob["id"]}, headers=alice["headers"],
    )
    response.raise_for_status()
    room = response.json()["id"]

    response = api.post(
        f"/api/chat/rooms/{room}/messages", headers=alice["headers"],
        json={"content": "CI: original HTTP polling chat"},
    )
    response.raise_for_status()
    message_id = response.json()["id"]

    response = api.get(f"/api/chat/rooms/{room}/messages", headers=bob["headers"])
    response.raise_for_status()
    assert message_id in [message["id"] for message in response.json()]
    response = api.patch(f"/api/chat/rooms/{room}/messages/read", headers=bob["headers"])
    response.raise_for_status()
    print("HTTP chat send, polling, and read status passed.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("origin")
    parser.add_argument("--ci", action="store_true", help="Create test accounts in an isolated CI database")
    args = parser.parse_args()

    try:
        with httpx.Client(base_url=args.url, timeout=30) as api:
            response = api.get("/", headers={"Origin": args.origin})
            response.raise_for_status()
            assert response.headers["access-control-allow-origin"] == args.origin

            for path in ("/api/product/", "/api/auction/"):
                response = api.get(path)
                response.raise_for_status()
                assert isinstance(response.json(), list)
            print("HTTP, CORS, product list, and auction list passed.")

            if args.ci:
                check_accounts(api)
    except httpx.HTTPStatusError as error:
        print(f"HTTP check failed: {error.request.method} {error.request.url.path} ({error.response.status_code}).")
        return 1
    except Exception as error:
        print(f"Check failed ({type(error).__name__}). No credentials logged.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
