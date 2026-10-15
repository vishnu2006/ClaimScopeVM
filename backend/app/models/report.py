import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    JSON,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.schemas.common import ReportStatus, ReportType

if TYPE_CHECKING:
    from app.models.case import Case


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    report_type: Mapped[ReportType] = mapped_column(
        SAEnum(ReportType, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=ReportType.INVESTIGATION,
        nullable=False,
    )
    status: Mapped[ReportStatus] = mapped_column(
        SAEnum(ReportStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=ReportStatus.DRAFT,
        nullable=False,
        index=True,
    )
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    findings: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    risk_indicators: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    generated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    report_data: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="reports")
