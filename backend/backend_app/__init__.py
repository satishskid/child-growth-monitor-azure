# Child Growth Monitor Backend App Package

# Import create_app from the main app.py module
import sys
import os

# Add the parent directory to sys.path to allow importing from app.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app import create_app
    # Make create_app available from this package
    __all__ = ['create_app']
except ImportError:
    # Fallback if app.py can't be imported
    pass
