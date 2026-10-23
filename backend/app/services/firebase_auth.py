import json
import logging
import os
from typing import Any, Dict, Optional

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from app.config import settings

logger = logging.getLogger(__name__)

_firebase_initialized = False


def initialize_firebase_admin() -> bool:
    """Initialize Firebase Admin SDK once using available credentials."""
    global _firebase_initialized
    if _firebase_initialized:
        return True

    if len(firebase_admin._apps) > 0:
        _firebase_initialized = True
        return True

    try:
        # 1. Direct JSON string from environment variable (ideal for Render / Cloud)
        if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            cert_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_JSON environment variable.")
            return True

        # 2. File path to service account credentials
        if settings.FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info(f"Firebase Admin initialized via service account file: {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")
            return True

        # 3. Google Application Default Credentials or Project ID fallback
        if settings.FIREBASE_PROJECT_ID:
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            _firebase_initialized = True
            logger.info(f"Firebase Admin initialized with projectId: {settings.FIREBASE_PROJECT_ID}")
            return True

        # 4. Try default application credentials
        try:
            firebase_admin.initialize_app()
            _firebase_initialized = True
            logger.info("Firebase Admin initialized via default application credentials.")
            return True
        except Exception:
            pass

        logger.warning(
            "Firebase Admin credentials not configured. Token verification will operate in unconfigured mode."
        )
        return False

    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return False


def verify_firebase_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token and returns decoded claims.
    Returns None if verification fails or Firebase Admin is not configured.
    """
    if not initialize_firebase_admin():
        return None

    try:
        decoded_token = firebase_auth.verify_id_token(id_token, check_revoked=False)
        return decoded_token
    except Exception as e:
        logger.warning(f"Firebase token verification failed: {e}")
        return None
