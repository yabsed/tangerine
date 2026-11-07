from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, logger, status
from fastapi.responses import RedirectResponse
from starlette.requests import Request

from authlib.integrations.starlette_client import OAuth, OAuthError, StarletteOAuth2App

from carrot.app.auth.schemas import TokenResponse, UserSigninRequest
from carrot.app.auth.services import AuthService
from carrot.app.auth.settings import AUTH_SETTINGS
from carrot.settings import SETTINGS

auth_router = APIRouter()

ACCESS_TOKEN_SECRET = AUTH_SETTINGS.ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET = AUTH_SETTINGS.REFRESH_TOKEN_SECRET
SHORT_SESSION_LIFESPAN = AUTH_SETTINGS.SHORT_SESSION_LIFESPAN
LONG_SESSION_LIFESPAN = AUTH_SETTINGS.LONG_SESSION_LIFESPAN


@auth_router.post("/tokens", response_model=TokenResponse)
async def signin(
    signin_request: UserSigninRequest,
    auth_service: Annotated[AuthService, Depends()],
) -> TokenResponse:
    access_token, refresh_token = await auth_service.signin(
        signin_request.email, signin_request.password
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@auth_router.get("/tokens/refresh", response_model=TokenResponse)
async def refresh_token(
    auth_service: Annotated[AuthService, Depends()],
    authorization: Annotated[str | None, Header()] = None,
) -> TokenResponse:
    access_token, refresh_token = await auth_service.refresh_tokens(authorization)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@auth_router.delete("/tokens", status_code=status.HTTP_204_NO_CONTENT)
async def delete_token(
    auth_service: Annotated[AuthService, Depends()],
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    await auth_service.delete_token(authorization)
    return


# configure OAuth client
oauth = OAuth()
oauth.register(
    name="google",
    client_id=AUTH_SETTINGS.GOOGLE_CLIENT_ID,
    client_secret=AUTH_SETTINGS.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
google: StarletteOAuth2App = oauth.create_client("google")  # type: ignore


def get_redirect_uri(request: Request) -> str:
    uri_obj = request.url_for("receive_code")

    if not SETTINGS.is_local:
        uri_obj = uri_obj.replace(scheme="https")  # nginx changes scheme to https

    return str(uri_obj)


@auth_router.get("/oauth2/login/google", status_code=status.HTTP_307_TEMPORARY_REDIRECT)
async def get_redirect_url(request: Request):
    redirect_uri = get_redirect_uri(request)
    auth_data = await google.create_authorization_url(redirect_uri)
    google_auth_url = auth_data.get("url")

    if google_auth_url is None:
        logger.logger.error("Google OAuth URL generation failed: URL is None")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="구글 로그인 초기화에 실패했습니다.",
        )

    await google.save_authorize_data(request, **auth_data)
    # print(f"DEBUG SESSION: {request.session}")
    return RedirectResponse(google_auth_url)
    # return {"redirect_url": google_auth_url}


@auth_router.get("/oauth2/code/google")
async def receive_code(
    request: Request,
    auth_service: Annotated[AuthService, Depends()],
):
    redirect_uri = get_redirect_uri(request)

    try:
        token = await google.authorize_access_token(request, redirect_uri=redirect_uri)
    except OAuthError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{error.error}: {error.description}",
        )

    access_token, refresh_token = await auth_service.handle_google_oauth2(token)
    redirect_url = (
        f"{AUTH_SETTINGS.FRONTEND_URL}"
        f"?access_token={access_token}&refresh_token={refresh_token}"
    )
    return RedirectResponse(url=redirect_url)
