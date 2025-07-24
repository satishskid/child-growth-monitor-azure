"""
Utility functions for data validation and security.
"""

import re
from typing import Any, Dict


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_consent_data(data: Dict[str, Any]) -> bool:
    """Validate consent form data."""
    required_fields = [
        "child_id",
        "guardian_signature",
        "qr_code_data",
        "consent_given",
        "data_usage_agreed",
        "privacy_policy_accepted",
    ]

    for field in required_fields:
        if field not in data:
            return False

    # All boolean fields must be True for valid consent
    boolean_fields = ["consent_given", "data_usage_agreed", "privacy_policy_accepted"]
    for field in boolean_fields:
        if not data[field]:
            return False

    return True
