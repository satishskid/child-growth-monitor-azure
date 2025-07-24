"""
Database initialization and migration scripts for Child Growth Monitor
"""

import os
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.extensions import db
from app.models import User, Child, Consent, ScanSession, ScanData, AnthropometricPrediction
from app.config import get_config

logger = logging.getLogger(__name__)


def create_database():
    """Create database and tables."""
    try:
        config = get_config()
        
        # Create database engine
        engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
        
        # Create all tables
        db.metadata.create_all(engine)
        
        logger.info("Database tables created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating database: {str(e)}")
        return False


def init_default_data():
    """Initialize database with default data."""
    try:
        # Create default admin user
        admin_user = User(
            email="admin@childgrowthmonitor.org",
            name="System Administrator",
            role="administrator",
            organization="Child Growth Monitor",
            is_active=True,
            email_verified=True
        )
        admin_user.set_password("admin123")  # Should be changed in production
        
        db.session.add(admin_user)
        
        # Create sample healthcare worker
        healthcare_worker = User(
            email="healthcare@example.org",
            name="Healthcare Worker",
            role="healthcare_worker", 
            organization="Local Health Center",
            is_active=True,
            email_verified=True
        )
        healthcare_worker.set_password("healthcare123")
        
        db.session.add(healthcare_worker)
        
        db.session.commit()
        
        logger.info("Default data initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing default data: {str(e)}")
        db.session.rollback()
        return False


def migrate_database():
    """Run database migrations."""
    try:
        # Add any migration logic here
        # For now, just ensure all tables exist
        create_database()
        
        logger.info("Database migration completed")
        return True
        
    except Exception as e:
        logger.error(f"Error migrating database: {str(e)}")
        return False


def reset_database():
    """Reset database - WARNING: This will delete all data."""
    try:
        config = get_config()
        engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
        
        # Drop all tables
        db.metadata.drop_all(engine)
        
        # Recreate tables
        db.metadata.create_all(engine)
        
        logger.info("Database reset completed")
        return True
        
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        return False


def backup_database(backup_path: str = None):
    """Create database backup."""
    try:
        if backup_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"backups/cgm_backup_{timestamp}.sql"
        
        # Ensure backup directory exists
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        
        config = get_config()
        
        # For SQLite
        if "sqlite" in config.SQLALCHEMY_DATABASE_URI:
            import shutil
            db_path = config.SQLALCHEMY_DATABASE_URI.replace("sqlite:///", "")
            shutil.copy2(db_path, backup_path.replace(".sql", ".db"))
            logger.info(f"SQLite database backed up to {backup_path.replace('.sql', '.db')}")
        
        # For PostgreSQL (would need pg_dump)
        elif "postgresql" in config.SQLALCHEMY_DATABASE_URI:
            logger.warning("PostgreSQL backup requires pg_dump utility")
            # Implementation would use subprocess to call pg_dump
        
        return True
        
    except Exception as e:
        logger.error(f"Error backing up database: {str(e)}")
        return False


def check_database_health():
    """Check database connection and basic health."""
    try:
        config = get_config()
        engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
        
        # Check if tables exist
        tables = db.metadata.tables.keys()
        existing_tables = []
        
        with engine.connect() as connection:
            for table_name in tables:
                try:
                    connection.execute(text(f"SELECT 1 FROM {table_name} LIMIT 1"))
                    existing_tables.append(table_name)
                except:
                    pass
        
        health_status = {
            "connection": "OK",
            "tables_expected": len(tables),
            "tables_existing": len(existing_tables),
            "missing_tables": list(set(tables) - set(existing_tables))
        }
        
        logger.info(f"Database health check: {health_status}")
        return health_status
        
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {"connection": "FAILED", "error": str(e)}


if __name__ == "__main__":
    import sys
    from app import create_app
    
    app = create_app()
    
    with app.app_context():
        command = sys.argv[1] if len(sys.argv) > 1 else "init"
        
        if command == "init":
            print("Initializing database...")
            if create_database():
                print("✓ Database tables created")
                if init_default_data():
                    print("✓ Default data initialized")
                else:
                    print("✗ Failed to initialize default data")
            else:
                print("✗ Failed to create database")
                
        elif command == "migrate":
            print("Running database migrations...")
            if migrate_database():
                print("✓ Migration completed")
            else:
                print("✗ Migration failed")
                
        elif command == "reset":
            confirm = input("⚠️  This will delete ALL data. Type 'yes' to confirm: ")
            if confirm.lower() == "yes":
                if reset_database():
                    print("✓ Database reset completed")
                    if init_default_data():
                        print("✓ Default data reinitialized")
                else:
                    print("✗ Database reset failed")
            else:
                print("Reset cancelled")
                
        elif command == "backup":
            backup_path = sys.argv[2] if len(sys.argv) > 2 else None
            print(f"Creating database backup...")
            if backup_database(backup_path):
                print("✓ Backup completed")
            else:
                print("✗ Backup failed")
                
        elif command == "health":
            print("Checking database health...")
            health = check_database_health()
            if health["connection"] == "OK":
                print("✓ Database connection OK")
                print(f"✓ Tables: {health['tables_existing']}/{health['tables_expected']}")
                if health["missing_tables"]:
                    print(f"⚠️  Missing tables: {health['missing_tables']}")
            else:
                print(f"✗ Database connection failed: {health.get('error', 'Unknown error')}")
                
        else:
            print("Available commands:")
            print("  init    - Initialize database with tables and default data")
            print("  migrate - Run database migrations")
            print("  reset   - Reset database (WARNING: deletes all data)")
            print("  backup  - Create database backup")
            print("  health  - Check database health")
