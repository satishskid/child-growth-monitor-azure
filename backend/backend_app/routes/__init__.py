"""
API route blueprints for Child Growth Monitor backend.
"""

from backend_app.extensions import db
from backend_app.models import Child, Consent, ScanSession, User
from backend_app.utils.validators import validate_consent_data, validate_email
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash

# Create blueprints
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
children_bp = Blueprint("children", __name__, url_prefix="/api/children")
scans_bp = Blueprint("scans", __name__, url_prefix="/api/scans")
consent_bp = Blueprint("consent", __name__, url_prefix="/api/consent")


# Authentication routes
@auth_bp.route("/login", methods=["POST"])
def login():
    """User authentication endpoint."""
    try:
        data = request.get_json()
        email = data.get("email", "").lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid credentials"}), 401

        if user.is_locked:
            return (
                jsonify({"error": "Account locked due to failed login attempts"}),
                423,
            )

        # Create access token
        access_token = create_access_token(identity=str(user.id))

        # Update last login
        user.last_login = db.func.now()
        user.unlock_account()  # Reset failed attempts on successful login
        db.session.commit()

        return (
            jsonify(
                {
                    "access_token": access_token,
                    "user": {
                        "id": str(user.id),
                        "email": user.email,
                        "name": user.name,
                        "role": user.role.value,
                        "organization": user.organization,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": "Login failed"}), 500


@auth_bp.route("/register", methods=["POST"])
def register():
    """User registration endpoint."""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["email", "password", "name", "role"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400

        email = data["email"].lower()

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "User already exists"}), 409

        # Create new user
        user = User(
            email=email,
            name=data["name"],
            role=data["role"],
            organization=data.get("organization"),
            agreed_to_terms=data.get("agreed_to_terms", False),
        )
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User created successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Registration failed"}), 500


# Children management routes
@children_bp.route("/", methods=["GET"])
@jwt_required()
def get_children():
    """Get children associated with current user."""
    try:
        user_id = get_jwt_identity()
        children = Child.query.filter_by(created_by_id=user_id).all()

        return (
            jsonify(
                {"children": [child.to_dict(include_pii=True) for child in children]}
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": "Failed to fetch children"}), 500


@children_bp.route("/", methods=["POST"])
@jwt_required()
def create_child():
    """Create new child record."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        required_fields = ["name", "date_of_birth", "gender", "guardian_name"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400

        # Create child record
        child = Child(
            name=data["name"],
            date_of_birth=data["date_of_birth"],
            gender=data["gender"],
            guardian_name=data["guardian_name"],
            guardian_contact=data.get("guardian_contact"),
            created_by_id=user_id,
        )

        db.session.add(child)
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Child record created",
                    "child": child.to_dict(include_pii=True),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create child record"}), 500


# Consent management routes
@consent_bp.route("/", methods=["POST"])
@jwt_required()
def create_consent():
    """Create consent record for child."""
    try:
        data = request.get_json()

        # Validate consent data
        if not validate_consent_data(data):
            return jsonify({"error": "Invalid consent data"}), 400

        consent = Consent(
            child_id=data["child_id"],
            guardian_signature=data["guardian_signature"],
            qr_code_data=data["qr_code_data"],
            consent_given=data["consent_given"],
            data_usage_agreed=data["data_usage_agreed"],
            privacy_policy_accepted=data["privacy_policy_accepted"],
        )

        db.session.add(consent)
        db.session.commit()

        return (
            jsonify({"message": "Consent recorded", "consent_id": str(consent.id)}),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to record consent"}), 500


# Scanning routes
@scans_bp.route("/session", methods=["POST"])
@jwt_required()
def create_scan_session():
    """Create new scanning session."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Verify consent is valid
        consent = Consent.query.get(data["consent_id"])
        if not consent or not consent.is_valid:
            return jsonify({"error": "Valid consent required"}), 400

        session = ScanSession(
            child_id=data["child_id"],
            consent_id=data["consent_id"],
            user_id=user_id,
            device_info=data.get("device_info", {}),
            environmental_conditions=data.get("environmental_conditions", {}),
        )

        db.session.add(session)
        db.session.commit()

        return (
            jsonify({"session_id": str(session.id), "status": session.status.value}),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create scan session"}), 500


def register_blueprints(app):
    """Register all blueprints with the Flask app."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(children_bp)
    app.register_blueprint(scans_bp)
    app.register_blueprint(consent_bp)
