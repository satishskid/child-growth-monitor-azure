"""
Database models for Child Growth Monitor.
Defines the data structure for child health data with privacy and security in mind.
"""

import enum
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from backend_app.extensions import db
from backend_app.utils.encryption import decrypt_pii, encrypt_pii
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, validates
from werkzeug.security import check_password_hash, generate_password_hash


class UserRole(enum.Enum):
    """User roles for access control."""

    HEALTHCARE_WORKER = "healthcare_worker"
    ADMINISTRATOR = "administrator"
    VOLUNTEER = "volunteer"
    DATA_SCIENTIST = "data_scientist"


class GenderEnum(enum.Enum):
    """Gender enumeration."""

    MALE = "male"
    FEMALE = "female"


class ScanTypeEnum(enum.Enum):
    """Types of scans performed."""

    FRONT = "front"
    BACK = "back"
    SIDE_LEFT = "side_left"
    SIDE_RIGHT = "side_right"


class ScanStatusEnum(enum.Enum):
    """Scan processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class NutritionalStatusEnum(enum.Enum):
    """Nutritional status categories."""

    NORMAL = "normal"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class BaseModel(db.Model):
    """Base model with common fields."""

    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def to_dict(self, include_pii: bool = False) -> Dict[str, Any]:
        """Convert model to dictionary, optionally excluding PII."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            elif isinstance(value, uuid.UUID):
                value = str(value)
            elif isinstance(value, enum.Enum):
                value = value.value
            result[column.name] = value
        return result


class User(BaseModel):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.HEALTHCARE_WORKER)
    organization = Column(String(200))
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime)

    # Privacy settings
    agreed_to_terms = Column(Boolean, default=False, nullable=False)
    privacy_policy_version = Column(String(10))

    # Relationships
    children = relationship("Child", back_populates="created_by", lazy="dynamic")
    scan_sessions = relationship("ScanSession", back_populates="user", lazy="dynamic")

    def set_password(self, password: str) -> None:
        """Set password hash."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Check password against hash."""
        return check_password_hash(self.password_hash, password)

    @hybrid_property
    def is_locked(self) -> bool:
        """Check if account is locked."""
        return (
            self.account_locked_until and self.account_locked_until > datetime.utcnow()
        )

    def lock_account(self, duration_minutes: int = 30) -> None:
        """Lock account for specified duration."""
        self.account_locked_until = datetime.utcnow() + timedelta(
            minutes=duration_minutes
        )
        self.failed_login_attempts += 1

    def unlock_account(self) -> None:
        """Unlock account and reset failed attempts."""
        self.account_locked_until = None
        self.failed_login_attempts = 0

    @validates("email")
    def validate_email(self, key, email):
        """Validate email format."""
        if "@" not in email:
            raise ValueError("Invalid email format")
        return email.lower()


class Child(BaseModel):
    """Child model with encrypted PII data."""

    __tablename__ = "children"

    # Encrypted PII fields
    name_encrypted = Column(Text)  # Encrypted child name
    guardian_name_encrypted = Column(Text)  # Encrypted guardian name
    guardian_contact_encrypted = Column(Text)  # Encrypted contact info

    # Non-PII fields
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(Enum(GenderEnum), nullable=False)
    location_latitude = Column(Float)
    location_longitude = Column(Float)
    location_address = Column(String(500))  # General area, not specific address

    # Anonymized identifier for ML processing
    anonymous_id = Column(String(64), unique=True, nullable=False, index=True)

    # Foreign keys
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    created_by = relationship("User", back_populates="children")
    consents = relationship("Consent", back_populates="child", lazy="dynamic")
    scan_sessions = relationship("ScanSession", back_populates="child", lazy="dynamic")

    def __init__(self, **kwargs):
        # Generate anonymous ID
        kwargs["anonymous_id"] = str(uuid.uuid4())[:8]
        super().__init__(**kwargs)

    @hybrid_property
    def name(self) -> Optional[str]:
        """Decrypt and return child name."""
        if self.name_encrypted:
            return decrypt_pii(self.name_encrypted)
        return None

    @name.setter
    def name(self, value: str) -> None:
        """Encrypt and store child name."""
        if value:
            self.name_encrypted = encrypt_pii(value)

    @hybrid_property
    def guardian_name(self) -> Optional[str]:
        """Decrypt and return guardian name."""
        if self.guardian_name_encrypted:
            return decrypt_pii(self.guardian_name_encrypted)
        return None

    @guardian_name.setter
    def guardian_name(self, value: str) -> None:
        """Encrypt and store guardian name."""
        if value:
            self.guardian_name_encrypted = encrypt_pii(value)

    @hybrid_property
    def guardian_contact(self) -> Optional[str]:
        """Decrypt and return guardian contact."""
        if self.guardian_contact_encrypted:
            return decrypt_pii(self.guardian_contact_encrypted)
        return None

    @guardian_contact.setter
    def guardian_contact(self, value: str) -> None:
        """Encrypt and store guardian contact."""
        if value:
            self.guardian_contact_encrypted = encrypt_pii(value)

    @hybrid_property
    def age_months(self) -> int:
        """Calculate age in months."""
        today = datetime.utcnow().date()
        birth_date = self.date_of_birth.date()
        months = (today.year - birth_date.year) * 12 + (today.month - birth_date.month)
        return max(0, months)

    def to_dict(self, include_pii: bool = False) -> Dict[str, Any]:
        """Convert to dictionary with PII protection."""
        result = super().to_dict(include_pii=include_pii)

        if include_pii:
            result["name"] = self.name
            result["guardian_name"] = self.guardian_name
            result["guardian_contact"] = self.guardian_contact
        else:
            # Remove encrypted fields and use anonymous data
            result.pop("name_encrypted", None)
            result.pop("guardian_name_encrypted", None)
            result.pop("guardian_contact_encrypted", None)
            result["anonymous_id"] = self.anonymous_id

        result["age_months"] = self.age_months
        return result


class Consent(BaseModel):
    """Consent management for child data usage."""

    __tablename__ = "consents"

    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False)
    guardian_signature = Column(Text, nullable=False)  # Base64 encoded signature
    qr_code_data = Column(Text, nullable=False)  # QR code verification data

    # Consent details
    consent_given = Column(Boolean, default=False, nullable=False)
    data_usage_agreed = Column(Boolean, default=False, nullable=False)
    privacy_policy_accepted = Column(Boolean, default=False, nullable=False)
    research_participation = Column(Boolean, default=False)

    # Consent lifecycle
    consent_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    expiry_date = Column(DateTime)
    withdrawn_at = Column(DateTime)
    withdrawal_reason = Column(Text)

    # Relationships
    child = relationship("Child", back_populates="consents")
    scan_sessions = relationship(
        "ScanSession", back_populates="consent", lazy="dynamic"
    )

    @hybrid_property
    def is_valid(self) -> bool:
        """Check if consent is still valid."""
        now = datetime.utcnow()
        return (
            self.consent_given
            and not self.withdrawn_at
            and (not self.expiry_date or self.expiry_date > now)
        )

    @hybrid_property
    def is_expired(self) -> bool:
        """Check if consent has expired."""
        return self.expiry_date and self.expiry_date < datetime.utcnow()

    def withdraw_consent(self, reason: str = None) -> None:
        """Withdraw consent with optional reason."""
        self.withdrawn_at = datetime.utcnow()
        self.withdrawal_reason = reason


class ScanSession(BaseModel):
    """Scanning session containing multiple scans."""

    __tablename__ = "scan_sessions"

    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False)
    consent_id = Column(UUID(as_uuid=True), ForeignKey("consents.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    status = Column(
        Enum(ScanStatusEnum), default=ScanStatusEnum.PENDING, nullable=False
    )
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)

    # Device and environment metadata
    device_info = Column(JSON)
    environmental_conditions = Column(JSON)

    # Relationships
    child = relationship("Child", back_populates="scan_sessions")
    consent = relationship("Consent", back_populates="scan_sessions")
    user = relationship("User", back_populates="scan_sessions")
    scans = relationship("ScanData", back_populates="session", lazy="dynamic")
    predictions = relationship(
        "AnthropometricPrediction", back_populates="session", uselist=False
    )


class ScanData(BaseModel):
    """Individual scan data (video/images)."""

    __tablename__ = "scan_data"

    session_id = Column(
        UUID(as_uuid=True), ForeignKey("scan_sessions.id"), nullable=False
    )
    scan_type = Column(Enum(ScanTypeEnum), nullable=False)

    # File storage
    video_blob_path = Column(String(500))  # Azure Blob Storage path
    depth_map_blob_path = Column(String(500))
    rgb_images_blob_paths = Column(JSON)  # List of blob paths

    # Processing status
    status = Column(
        Enum(ScanStatusEnum), default=ScanStatusEnum.PENDING, nullable=False
    )
    processing_started_at = Column(DateTime)
    processing_completed_at = Column(DateTime)
    error_message = Column(Text)

    # Scan quality metrics
    quality_score = Column(Float)
    frame_count = Column(Integer)
    duration_seconds = Column(Float)

    # Relationships
    session = relationship("ScanSession", back_populates="scans")


class AnthropometricPrediction(BaseModel):
    """ML predictions for child measurements."""

    __tablename__ = "anthropometric_predictions"

    session_id = Column(
        UUID(as_uuid=True), ForeignKey("scan_sessions.id"), nullable=False
    )

    # Measurements
    height_cm = Column(Float)
    height_confidence = Column(Float)
    weight_kg = Column(Float)
    weight_confidence = Column(Float)
    arm_circumference_cm = Column(Float)
    arm_circumference_confidence = Column(Float)
    head_circumference_cm = Column(Float)
    head_circumference_confidence = Column(Float)

    # Z-scores and percentiles
    height_z_score = Column(Float)
    weight_z_score = Column(Float)
    wfa_z_score = Column(Float)  # Weight-for-age
    hfa_z_score = Column(Float)  # Height-for-age
    wfh_z_score = Column(Float)  # Weight-for-height

    # Nutritional status
    stunting_status = Column(Enum(NutritionalStatusEnum))
    wasting_status = Column(Enum(NutritionalStatusEnum))
    underweight_status = Column(Enum(NutritionalStatusEnum))
    overall_risk = Column(String(20))  # low, medium, high, critical

    # Model metadata
    model_version = Column(String(50), nullable=False)
    prediction_confidence = Column(Float)
    recommendations = Column(JSON)  # List of recommendations

    # Relationships
    session = relationship("ScanSession", back_populates="predictions")


class DataAnonymizationLog(BaseModel):
    """Log of data anonymization activities."""

    __tablename__ = "data_anonymization_logs"

    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False)
    anonymization_type = Column(String(50), nullable=False)  # full, partial, etc.
    fields_anonymized = Column(JSON)  # List of field names
    reason = Column(String(200))
    performed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Compliance
    gdpr_compliant = Column(Boolean, default=True)
    retention_policy_applied = Column(Boolean, default=True)
