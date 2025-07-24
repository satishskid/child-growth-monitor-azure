"""
Logging configuration for Child Growth Monitor backend.
Healthcare-grade logging with privacy considerations.
"""

import logging
import logging.handlers
import os
from typing import Optional


def setup_logging(app_name: str = "child_growth_monitor", 
                 log_level: str = "INFO",
                 log_dir: str = "logs") -> logging.Logger:
    """
    Setup comprehensive logging for healthcare applications.
    
    Args:
        app_name: Name of the application
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory to store log files
        
    Returns:
        Configured logger instance
    """
    
    # Create logs directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)
    
    # Create logger
    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)
    logger.addHandler(console_handler)
    
    # File handler for all logs
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    logger.addHandler(file_handler)
    
    # Separate file handler for errors
    error_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}_errors.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    logger.addHandler(error_handler)
    
    # Security audit log handler
    audit_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}_audit.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=10  # Keep more audit logs
    )
    audit_handler.setLevel(logging.WARNING)
    audit_handler.setFormatter(detailed_formatter)
    
    # Create audit logger
    audit_logger = logging.getLogger(f"{app_name}_audit")
    audit_logger.addHandler(audit_handler)
    audit_logger.setLevel(logging.WARNING)
    
    logger.info(f"Logging initialized for {app_name}")
    return logger


def get_audit_logger(app_name: str = "child_growth_monitor") -> logging.Logger:
    """Get the audit logger for security events."""
    return logging.getLogger(f"{app_name}_audit")
