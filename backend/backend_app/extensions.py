"""
Flask application extensions initialization.
"""

from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def init_extensions(app):
    """Initialize Flask extensions with app context."""
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
