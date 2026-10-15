import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum as SAEnum, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.schemas.common import CasePriority, CaseStatus

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.evidence import Evidence
    from app.models.report import Report


class Case(Base, TimestampMixin):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[CaseStatus] = mapped_column(
        SAEnum(CaseStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=CaseStatus.OPEN,
        nullable=False,
        index=True,
    )
    priority: Mapped[CasePriority] = mapped_column(
        SAEnum(CasePriority, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=CasePriority.MEDIUM,
        nullable=False,
    )
    claimant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    policy_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    incident_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    evidences: Mapped[List["Evidence"]] = relationship(
        "Evidence",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
