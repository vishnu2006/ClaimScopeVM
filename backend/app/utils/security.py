import os
import re
import uuid


def sanitize_filename(filename: str) -> str:
    """Generate secure filename: {uuid}_{sanitized-original}{ext}

    Removes directory traversal sequences and unsafe characters,
    normalizes the file extension, and prefixes a unique UUID.
    """
    if not filename:
        return f"{uuid.uuid4().hex[:12]}_unnamed_file"

    base_name = os.path.basename(filename)
    name, ext = os.path.splitext(base_name)

    # Sanitize the name component
    clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", name)
    clean_name = re.sub(r"_+", "_", clean_name).strip("._")
    if not clean_name:
        clean_name = "file"

    # Sanitize the extension component
    clean_ext = re.sub(r"[^a-zA-Z0-9\.]", "", ext).lower()
    if clean_ext and not clean_ext.startswith("."):
        clean_ext = f".{clean_ext}"

    prefix = uuid.uuid4().hex[:8]
    return f"{prefix}_{clean_name}{clean_ext}"
