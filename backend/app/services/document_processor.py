import os
from typing import Any, Dict, List, Optional
import pymupdf
from google.genai import types

from app.prompts import DOCUMENT_TRANSCRIPTION_PROMPT
from app.services.llm_provider import ConfigurationError, LLMProvider, get_llm_provider


class DocumentProcessor:
    """Document processing service using PyMuPDF for native PDF extraction
    and Gemini multimodal vision for scanned, handwritten, or image-based documents.
    """

    def extract_text_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract native text from a digitally-generated PDF.
        Returns dict with 'text', 'pages', 'page_count', 'metadata',
        'has_native_text', and 'extraction_method'.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at path: {file_path}")

        doc = pymupdf.open(file_path)
        pages: List[Dict[str, Any]] = []
        full_text = ""

        try:
            for page_num, page in enumerate(doc, 1):
                page_text = page.get_text() or ""
                pages.append({"page_number": page_num, "text": page_text})
                full_text += page_text + "\n"

            cleaned_full_text = full_text.strip()
            # If text has more than 50 alphanumeric characters, it is native digital text
            has_meaningful_text = len(cleaned_full_text) > 50

            return {
                "text": cleaned_full_text,
                "pages": pages,
                "page_count": len(doc),
                "metadata": dict(doc.metadata or {}),
                "has_native_text": has_meaningful_text,
                "extraction_method": "native_pdf" if has_meaningful_text else "needs_multimodal_ocr",
            }
        finally:
            doc.close()

    def render_pdf_pages_as_images(
        self, file_path: str, max_pages: int = 5
    ) -> List[bytes]:
        """Render PDF pages as PNG byte buffers for Gemini multimodal vision processing."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        doc = pymupdf.open(file_path)
        rendered_pages: List[bytes] = []

        try:
            total_pages = min(len(doc), max_pages)
            for page_idx in range(total_pages):
                page = doc[page_idx]
                # 150 DPI provides adequate fidelity for Gemini multimodal without bloated payloads
                pix = page.get_pixmap(dpi=150)
                rendered_pages.append(pix.tobytes("png"))
            return rendered_pages
        finally:
            doc.close()

    async def transcribe_scanned_document(
        self,
        file_path: str,
        llm_provider: Optional[LLMProvider] = None,
    ) -> str:
        """Transcribe scanned or handwritten PDF/image using Gemini multimodal processing."""
        ext = os.path.splitext(file_path)[1].lower()
        provider = llm_provider or get_llm_provider()

        parts: List[Any] = []
        parts.append(DOCUMENT_TRANSCRIPTION_PROMPT)

        if ext == ".pdf":
            image_bytes_list = self.render_pdf_pages_as_images(file_path, max_pages=5)
            for img_bytes in image_bytes_list:
                parts.append(types.Part.from_bytes(data=img_bytes, mime_type="image/png"))
        elif ext in [".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp"]:
            with open(file_path, "rb") as f:
                img_bytes = f.read()
            mime = "image/png" if ext == ".png" else "image/jpeg"
            parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))

        class TranscribedText(types.BaseModel if hasattr(types, "BaseModel") else object):
            pass

        # Use generate_text on Gemini provider
        transcription = await provider.client.aio.models.generate_content(
            model=provider.model,
            contents=parts,
        )

        return transcription.text.strip() if transcription.text else ""
