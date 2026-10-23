import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.firebase_auth import verify_firebase_token

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)


async def get_optional_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Extracts Bearer token from Authorization header, verifies via Firebase Admin,
    and returns or provisions the corresponding PostgreSQL User record.
    Returns None if no token or invalid token (when REQUIRE_AUTH=False).
    """
    if not auth_header or not auth_header.credentials:
        if settings.REQUIRE_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials were not provided",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

    id_token = auth_header.credentials.strip()
    claims = verify_firebase_token(id_token)

    if not claims:
        if settings.REQUIRE_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

    firebase_uid = claims.get("uid") or claims.get("user_id")
    email = claims.get("email") or f"{firebase_uid}@firebase.user"
    display_name = claims.get("name")
    photo_url = claims.get("picture")
    is_verified = bool(claims.get("email_verified", False))

    if not firebase_uid:
        if settings.REQUIRE_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing user identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

    # Find or provision PostgreSQL user record
    stmt = select(User).where(User.firebase_uid == firebase_uid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if not user:
        # Check if email is already taken by a different user
        email_stmt = select(User).where(User.email == email)
        email_res = await db.execute(email_stmt)
        existing_by_email = email_res.scalar_one_or_none()

        if existing_by_email:
            # Link Firebase UID to existing account if email matches
            existing_by_email.firebase_uid = firebase_uid
            existing_by_email.display_name = display_name or existing_by_email.display_name
            existing_by_email.photo_url = photo_url or existing_by_email.photo_url
            existing_by_email.is_verified = is_verified or existing_by_email.is_verified
            existing_by_email.last_sign_in_at = now
            user = existing_by_email
        else:
            user = User(
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name,
                photo_url=photo_url,
                is_verified=is_verified,
                last_sign_in_at=now,
            )
            db.add(user)

        await db.commit()
        await db.refresh(user)
    else:
        # Update login timestamp and profile attributes if changed
        updated = False
        if is_verified and not user.is_verified:
            user.is_verified = True
            updated = True
        if display_name and user.display_name != display_name:
            user.display_name = display_name
            updated = True
        if photo_url and user.photo_url != photo_url:
            user.photo_url = photo_url
            updated = True

        user.last_sign_in_at = now
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support.",
        )

    return user


async def get_current_user(
    user: Optional[User] = Depends(get_optional_current_user),
) -> User:
    """Strict dependency requiring authenticated user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for this resource",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
