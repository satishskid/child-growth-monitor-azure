"""
Child Growth Monitor Backend Application
Main Flask application entry point with comprehensive healthcare-grade features.
"""

import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from werkzeug.middleware.proxy_fix import ProxyFix

# Import application modules
from app.config import get_config
from app.extensions import db, jwt
from app.models import User, Child, ScanSession, Consent
from app.routes import register_blueprints
from app.utils.logging import setup_logging
from app.utils.error_handlers import register_error_handlers
from app.middleware.security import SecurityMiddleware

def create_app(config_name=None):
    """Application factory pattern for Flask app creation."""
    
    # Initialize Flask app
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.getenv('FLASK_ENV', 'development')
    app.config.from_object(get_config(config_name))
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate = Migrate(app, db)
    
    # Setup CORS for mobile app
    CORS(app, resources={
        r"/api/*": {
            "origins": ["*"],  # Configure specific origins in production
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Add proxy fix for deployment behind reverse proxy
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    
    # Add security middleware
    app.wsgi_app = SecurityMiddleware(app.wsgi_app)
    
    # Setup logging
    setup_logging(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        """Simple health check endpoint for monitoring."""
        return jsonify({
            'status': 'healthy',
            'service': 'child-growth-monitor-api',
            'version': app.config.get('VERSION', '1.0.0'),
            'timestamp': request.headers.get('X-Request-ID', 'unknown')
        }), 200
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        """API information endpoint."""
        return jsonify({
            'name': 'Child Growth Monitor API',
            'version': '1.0.0',
            'description': 'Backend API for child malnutrition detection and monitoring',
            'docs_url': '/api/docs',
            'endpoints': {
                'auth': '/api/auth',
                'children': '/api/children',
                'scans': '/api/scans',
                'predictions': '/api/predictions',
                'consent': '/api/consent'
            }
        })
    
    # Database initialization
    @app.before_first_request
    def create_tables():
        """Create database tables on first request."""
        db.create_all()
        app.logger.info("Database tables created")
    
    # Request logging middleware
    @app.before_request
    def log_request_info():
        """Log incoming request information."""
        app.logger.info(f"Request: {request.method} {request.url}")
        if request.get_json():
            # Don't log sensitive data
            sanitized_data = {k: v for k, v in request.get_json().items() 
                            if k not in ['password', 'signature', 'token']}
            app.logger.debug(f"Request data: {sanitized_data}")
    
    # Response headers
    @app.after_request
    def after_request(response):
        """Add security headers to all responses."""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # GDPR compliance header for child data
        if request.path.startswith('/api/children') or request.path.startswith('/api/scans'):
            response.headers['X-Data-Protection'] = 'GDPR-Compliant'
            response.headers['X-Child-Data-Policy'] = 'Encrypted-Anonymous'
        
        return response
    
    return app

def main():
    """Main application entry point."""
    app = create_app()
    
    # Development server configuration
    if app.config['DEBUG']:
        app.logger.warning("Running in DEBUG mode - not suitable for production!")
        
    # Get configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    
    app.logger.info(f"Starting Child Growth Monitor API on {host}:{port}")
    app.logger.info(f"Environment: {app.config['ENV']}")
    app.logger.info(f"Debug mode: {app.config['DEBUG']}")
    
    # Run the application
    app.run(
        host=host,
        port=port,
        debug=app.config['DEBUG'],
        threaded=True
    )

if __name__ == '__main__':
    main()
