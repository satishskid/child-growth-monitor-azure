"""
Encryption utilities for PII data protection.
"""

import base64
import os
from dotenv import load_dotenv

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Load environment variables
load_dotenv()


# Generate or load encryption key
def get_encryption_key():
    """Get or generate encryption key for PII data."""
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        # Generate key from password and salt
        password = os.environ.get("ENCRYPTION_PASSWORD", "default-password").encode()
        salt = os.environ.get("ENCRYPTION_SALT", "default-salt").encode()

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
    else:
        key = key.encode()

    return key


# Initialize Fernet cipher (lazy loading)
cipher_suite = None


def get_cipher():
    """Get or initialize the cipher suite."""
    global cipher_suite
    if cipher_suite is None:
        cipher_suite = Fernet(get_encryption_key())
    return cipher_suite


def encrypt_pii(data: str) -> str:
    """Encrypt personally identifiable information."""
    if not data:
        return None

    encrypted_data = get_cipher().encrypt(data.encode())
    return base64.urlsafe_b64encode(encrypted_data).decode()


def decrypt_pii(encrypted_data: str) -> str:
    """Decrypt personally identifiable information."""
    if not encrypted_data:
        return None

    try:
        decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = get_cipher().decrypt(decoded_data)
        return decrypted_data.decode()
    except Exception:
        return None
