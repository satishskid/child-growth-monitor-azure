"""
Simple logging setup for Child Growth Monitor backend.
"""

import logging
import os


def setup_logging(app_name: str = "child_growth_monitor", 
                 log_level: str = "INFO",
                 log_dir: str = "logs") -> logging.Logger:
    """Setup basic logging for the application."""
    
    # Create logs directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)
    
    # Configure basic logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(os.path.join(log_dir, f"{app_name}.log"))
        ]
    )
    
    return logging.getLogger(app_name)
