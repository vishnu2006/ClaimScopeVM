import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.dependencies import get_db_session
from app.models.user import User
from app.schemas.user import UserProfileResponse, UserProfileUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    """Retrieve the authenticated user's profile from PostgreSQL."""
    return current_user


@router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(
    updates: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """Update profile details (e.g. display name, avatar)."""
    if updates.display_name is not None:
        current_user.display_name = updates.display_name.strip()
    if updates.photo_url is not None:
        current_user.photo_url = updates.photo_url.strip()

    await db.commit()
    await db.refresh(current_user)
    return current_user
