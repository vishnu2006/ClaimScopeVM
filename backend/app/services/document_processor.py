import os
from typing import Any, Dict, List, Optional
import fitz


class DocumentProcessor:
    """Document processing service using PyMuPDF for PDF text extraction.
    Designed so OCR can be added as a fallback in future stages.
    """

    def extract_text_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract native text from a digitally-generated PDF.
        Returns dict with 'text', 'pages', 'page_count', 'metadata',
        'has_native_text', and 'extraction_method'.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at path: {file_path}")

        doc = fitz.open(file_path)
        pages: List[Dict[str, Any]] = []
        full_text = ""

        try:
            for page_num, page in enumerate(doc, 1):
                page_text = page.get_text() or ""
                pages.append({"page_number": page_num, "text": page_text})
                full_text += page_text + "\n"

            cleaned_full_text = full_text.strip()
            has_meaningful_text = len(cleaned_full_text) > 50

            return {
                "text": cleaned_full_text,
                "pages": pages,
                "page_count": len(doc),
                "metadata": dict(doc.metadata or {}),
                "has_native_text": has_meaningful_text,
                "extraction_method": "native_pdf" if has_meaningful_text else "needs_ocr",
            }
        finally:
            doc.close()

    def process_document(
        self,
        file_path: str,
        mime_type: Optional[str] = None,
        file_extension: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Process any supported document type, extracting text or metadata."""
        ext = (file_extension or os.path.splitext(file_path)[1]).lower()

        if ext == ".pdf":
            return self.extract_text_from_pdf(file_path)

        if ext in [".jpg", ".jpeg", ".png", ".tiff", ".tif"]:
            return {
                "text": "",
                "pages": [],
                "page_count": 1,
                "metadata": {"file_type": "image", "extension": ext},
                "has_native_text": False,
                "extraction_method": "vision_analysis_required",
            }

        # Plain text fallback
        if ext in [".txt", ".csv", ".json", ".log"]:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return {
                "text": content.strip(),
                "pages": [{"page_number": 1, "text": content}],
                "page_count": 1,
                "metadata": {"file_type": "text"},
                "has_native_text": len(content.strip()) > 0,
                "extraction_method": "plain_text",
            }

        # Generic document
        return {
            "text": "",
            "pages": [],
            "page_count": None,
            "metadata": {"file_type": "binary", "extension": ext},
            "has_native_text": False,
            "extraction_method": "unsupported_native_parser",
        }
