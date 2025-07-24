"""
Security middleware for Child Growth Monitor.
Handles security headers and basic protection measures for healthcare data.
"""

import logging
from typing import Callable, Any
from werkzeug.wrappers import Request, Response

logger = logging.getLogger(__name__)


class SecurityMiddleware:
    """
    Security middleware for healthcare applications.
    Adds security headers and basic protection measures.
    """

    def __init__(self, app: Callable):
        self.app = app

    def __call__(self, environ: dict, start_response: Callable) -> Any:
        """
        WSGI middleware implementation.
        Adds security headers to all responses.
        """
        def new_start_response(status: str, response_headers: list, exc_info=None):
            # Add security headers for healthcare data protection
            security_headers = [
                ('X-Content-Type-Options', 'nosniff'),
                ('X-Frame-Options', 'DENY'),
                ('X-XSS-Protection', '1; mode=block'),
                ('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'),
                ('Referrer-Policy', 'strict-origin-when-cross-origin'),
                ('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"),
            ]
            
            # Add security headers to response
            response_headers.extend(security_headers)
            
            return start_response(status, response_headers, exc_info)

        return self.app(environ, new_start_response)
