import uuid
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import (
    Boolean,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.schemas.common import EvidenceType

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.document import Document


class Evidence(Base, TimestampMixin):
    __tablename__ = "evidences"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True
    )
    evidence_type: Mapped[EvidenceType] = mapped_column(
        SAEnum(EvidenceType, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    field_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source_document: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    source_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_conflicting: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    conflicting_values: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="evidences")
    document: Mapped[Optional["Document"]] = relationship("Document", back_populates="evidences")
