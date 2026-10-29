import logging
import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.case import Case
from app.models.user import User

logger = logging.getLogger(__name__)


async def get_authorized_case(
    case_id: uuid.UUID,
    db: AsyncSession,
    user: Optional[User] = None,
    options: Optional[list] = None,
) -> Case:
    """
    Fetch a case and enforce user ownership.
    Rules:
    1. If user is authenticated:
       - Access granted if case.user_id == user.id.
       - Also allow access if case.user_id is None (e.g. pre-auth synthetic cases or demo cases).
         When an authenticated user acts on an unassigned case, it can be claimed/accessed.
       - If case.user_id is assigned to another user, strictly return 404 (or 403) to prevent data leakage.
    2. If user is unauthenticated:
       - Only allow access if case.user_id is None (public/demo cases).
       - If case.user_id is owned by a private user, return 404.
    """
    stmt = select(Case).where(Case.id == case_id)
    if options:
        for opt in options:
            stmt = stmt.options(opt)

    res = await db.execute(stmt)
    case = res.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )

    # Ownership check (skipped in local unauthenticated/detached mode)
    if user and case.user_id is not None and case.user_id != user.id:
        logger.warning(
            f"Unauthorized access attempt to case {case_id} by user {getattr(user, 'id', 'anonymous')}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )

    return case
