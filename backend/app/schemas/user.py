import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    email: EmailStr
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    last_sign_in_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
