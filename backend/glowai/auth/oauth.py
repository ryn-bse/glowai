import os
import requests
from flask import redirect, request, url_for
from glowai.models.user import find_by_email, create_user
from glowai.auth.service import issue_jwt
from glowai.models.session import create_session

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


def get_redirect_uri():
    return url_for("auth.google_callback", _external=True)


def google_login_redirect():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": get_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return redirect(f"{GOOGLE_AUTH_URL}?{query}")


def google_callback_handler():
    code = request.args.get("code")
    if not code:
        return redirect(f"{FRONTEND_URL}/login?error=oauth_failed")

    # Exchange code for tokens
    token_resp = requests.post(GOOGLE_TOKEN_URL, data={
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": get_redirect_uri(),
        "grant_type": "authorization_code",
    })
    if not token_resp.ok:
        return redirect(f"{FRONTEND_URL}/login?error=oauth_failed")

    access_token = token_resp.json().get("access_token")
    userinfo_resp = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if not userinfo_resp.ok:
        return redirect(f"{FRONTEND_URL}/login?error=oauth_failed")

    info = userinfo_resp.json()
    email = info.get("email", "").lower()
    user = find_by_email(email)
    if not user:
        user = create_user({
            "email": email,
            "first_name": info.get("given_name", ""),
            "last_name": info.get("family_name", ""),
            "password_hash": "",
            "oauth_provider": "google",
            "oauth_id": info.get("sub"),
        })

    token = issue_jwt(str(user["_id"]))
    create_session(str(user["_id"]), token)
    return redirect(f"{FRONTEND_URL}/dashboard?token={token}")
