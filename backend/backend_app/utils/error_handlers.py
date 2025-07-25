"""
Error handlers for Child Growth Monitor backend.
Provides comprehensive error handling for healthcare applications.
"""

import logging
from typing import Dict, Any

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


def register_error_handlers(app: Flask) -> None:

    @app.errorhandler(400)
    def bad_request(error: HTTPException) -> tuple[Dict[str, Any], int]:
        """Handle bad request errors."""
        logger.warning(f"Bad request: {request.url} - {error.description}")
        return jsonify({
            'error': 'Bad Request',
            'message': 'The request could not be understood by the server.',
            'status_code': 400
        }), 400

    @app.errorhandler(401)
    def unauthorized(error: HTTPException) -> tuple[Dict[str, Any], int]:
        """Handle unauthorized access errors."""
        logger.warning(f"Unauthorized access attempt: {request.url}")
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication is required to access this resource.',
            'status_code': 401
        }), 401

    @app.errorhandler(403)
    def forbidden(error: HTTPException) -> tuple[Dict[str, Any], int]:
        """Handle forbidden access errors."""
        logger.warning(f"Forbidden access attempt: {request.url}")
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource.',
            'status_code': 403
        }), 403

    @app.errorhandler(404)
    def not_found(error: HTTPException) -> tuple[Dict[str, Any], int]:
        """Handle not found errors."""
        logger.info(f"Resource not found: {request.url}")
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource could not be found.',
            'status_code': 404
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error: HTTPException) -> tuple[Dict[str, Any], int]:
        """Handle method not allowed errors."""
        logger.warning(f"Method not allowed: {request.method} {request.url}")
        return jsonify({
            'error': 'Method Not Allowed',
            'message': f'The {request.method} method is not allowed for this endpoint.',
            'status_code': 405,
            'allowed_methods': error.description if hasattr(error, 'description') else 'POST'
        }), 405

    @app.errorhandler(422)
    def unprocessable_entity(error: HTTPException) -> tuple[Dict[str, Any], int]:
        """Handle validation errors."""
        logger.warning(f"Validation error: {request.url} - {error.description}")
        return jsonify({
            'error': 'Unprocessable Entity',
            'message': 'The request was well-formed but contains semantic errors.',
            'status_code': 422
        }), 422

    @app.errorhandler(500)
    def internal_server_error(error: HTTPException) -> tuple[Dict[str, Any], int]:
        """Handle internal server errors."""
        logger.error(f"Internal server error: {request.url} - {str(error)}")
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred. Please try again later.',
            'status_code': 500
        }), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception) -> tuple[Dict[str, Any], int]:
        """Handle any unexpected errors."""
        logger.error(f"Unexpected error: {request.url} - {str(error)}", exc_info=True)
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred. Please try again later.',
            'status_code': 500
        }), 500
