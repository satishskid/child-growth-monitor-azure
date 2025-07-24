"""
Child Growth Monitor ML Service
FastAPI-based service for anthropometric predictions using computer vision and ML.
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import uvicorn
from config import get_settings
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models.anthropometric_predictor import AnthropometricPredictor

# ML service modules
from models.pose_estimator import PoseEstimator
from PIL import Image
from pydantic import BaseModel, Field
from utils.measurement_calculator import MeasurementCalculator
from utils.video_processor import VideoProcessor
from utils.who_standards import WHOStandards

# Initialize settings
settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title="Child Growth Monitor ML Service",
    description="Machine learning service for child anthropometric measurements",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models
pose_estimator = PoseEstimator()
anthropometric_predictor = AnthropometricPredictor()
video_processor = VideoProcessor()
measurement_calculator = MeasurementCalculator()
who_standards = WHOStandards()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Pydantic models for API
class ScanMetadata(BaseModel):
    """Metadata for scan processing."""

    child_age_months: int = Field(..., ge=0, le=60, description="Child age in months")
    child_gender: str = Field(..., regex="^(male|female)$", description="Child gender")
    scan_type: str = Field(..., regex="^(front|back|side_left|side_right)$")
    device_info: Dict = Field(default_factory=dict)
    environmental_conditions: Dict = Field(default_factory=dict)


class PoseKeypoints(BaseModel):
    """3D pose keypoints."""

    keypoints: List[List[float]] = Field(
        ..., description="3D keypoints [x, y, z, confidence]"
    )
    timestamp: float = Field(..., description="Frame timestamp")
    quality_score: float = Field(..., ge=0, le=1, description="Pose detection quality")


class AnthropometricMeasurement(BaseModel):
    """Individual measurement result."""

    value: float
    unit: str
    confidence: float = Field(..., ge=0, le=1)
    percentile: Optional[float] = None
    z_score: Optional[float] = None


class NutritionalAssessment(BaseModel):
    """Nutritional status assessment."""

    stunting_status: str = Field(..., regex="^(normal|mild|moderate|severe)$")
    wasting_status: str = Field(..., regex="^(normal|mild|moderate|severe)$")
    underweight_status: str = Field(..., regex="^(normal|mild|moderate|severe)$")
    overall_risk: str = Field(..., regex="^(low|medium|high|critical)$")
    recommendations: List[str]


class PredictionResult(BaseModel):
    """Complete prediction result."""

    height: AnthropometricMeasurement
    weight: AnthropometricMeasurement
    arm_circumference: AnthropometricMeasurement
    head_circumference: AnthropometricMeasurement
    nutritional_assessment: NutritionalAssessment
    model_version: str
    processing_time_seconds: float


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "child-growth-monitor-ml",
        "version": "1.0.0",
        "models_loaded": {
            "pose_estimator": pose_estimator.is_loaded,
            "anthropometric_predictor": anthropometric_predictor.is_loaded,
        },
    }


@app.post("/predict/single-frame", response_model=PoseKeypoints)
async def predict_single_frame(
    image: UploadFile = File(...), metadata: ScanMetadata = None
):
    """Process single frame for pose estimation."""
    try:
        # Validate file
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read and process image
        image_data = await image.read()
        img_array = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Perform pose estimation
        pose_result = pose_estimator.estimate_pose(img)

        return PoseKeypoints(
            keypoints=pose_result["keypoints"],
            timestamp=pose_result["timestamp"],
            quality_score=pose_result["quality_score"],
        )

    except Exception as e:
        logger.error(f"Error processing single frame: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.post("/predict/video", response_model=PredictionResult)
async def predict_from_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    metadata: ScanMetadata = None,
):
    """Process video file for complete anthropometric prediction."""
    try:
        # Validate file
        if not video.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="File must be a video")

        # Save uploaded video temporarily
        temp_video_path = f"/tmp/{video.filename}"
        with open(temp_video_path, "wb") as f:
            content = await video.read()
            f.write(content)

        # Process video
        result = await process_video_for_prediction(temp_video_path, metadata)

        # Clean up temporary file in background
        background_tasks.add_task(cleanup_temp_file, temp_video_path)

        return result

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.post("/predict/multi-scan", response_model=PredictionResult)
async def predict_from_multiple_scans(
    background_tasks: BackgroundTasks,
    front_video: UploadFile = File(...),
    back_video: UploadFile = File(...),
    side_left_video: UploadFile = File(None),
    side_right_video: UploadFile = File(None),
    metadata: ScanMetadata = None,
):
    """Process multiple scan videos for enhanced prediction accuracy."""
    try:
        import time

        start_time = time.time()

        # Process each video
        scan_results = {}
        videos = {
            "front": front_video,
            "back": back_video,
            "side_left": side_left_video,
            "side_right": side_right_video,
        }

        temp_files = []

        for scan_type, video_file in videos.items():
            if video_file is not None:
                # Save and process video
                temp_path = f"/tmp/{scan_type}_{video_file.filename}"
                temp_files.append(temp_path)

                with open(temp_path, "wb") as f:
                    content = await video_file.read()
                    f.write(content)

                # Process video
                scan_metadata = (
                    metadata.copy()
                    if metadata
                    else ScanMetadata(
                        child_age_months=24, child_gender="male", scan_type=scan_type
                    )
                )
                scan_metadata.scan_type = scan_type

                scan_results[scan_type] = await process_video_for_prediction(
                    temp_path, scan_metadata
                )

        # Combine results from multiple scans
        final_result = combine_multi_scan_results(scan_results, metadata)
        final_result.processing_time_seconds = time.time() - start_time

        # Clean up temporary files
        for temp_file in temp_files:
            background_tasks.add_task(cleanup_temp_file, temp_file)

        return final_result

    except Exception as e:
        logger.error(f"Error processing multiple scans: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


async def process_video_for_prediction(
    video_path: str, metadata: ScanMetadata
) -> PredictionResult:
    """Process a single video file for anthropometric prediction."""
    import time

    start_time = time.time()

    # Extract frames and pose data
    frames, poses = video_processor.process_video(video_path)

    # Calculate measurements from poses
    measurements = measurement_calculator.calculate_measurements(
        poses, metadata.scan_type, metadata.child_age_months
    )

    # Make anthropometric predictions
    predictions = anthropometric_predictor.predict(
        measurements, age_months=metadata.child_age_months, gender=metadata.child_gender
    )

    # Calculate WHO percentiles and z-scores
    who_metrics = who_standards.calculate_metrics(
        height_cm=predictions["height"],
        weight_kg=predictions["weight"],
        age_months=metadata.child_age_months,
        gender=metadata.child_gender,
    )

    # Assess nutritional status
    nutritional_assessment = assess_nutritional_status(who_metrics)

    # Create result
    result = PredictionResult(
        height=AnthropometricMeasurement(
            value=predictions["height"],
            unit="cm",
            confidence=predictions["height_confidence"],
            percentile=who_metrics["height_percentile"],
            z_score=who_metrics["height_z_score"],
        ),
        weight=AnthropometricMeasurement(
            value=predictions["weight"],
            unit="kg",
            confidence=predictions["weight_confidence"],
            percentile=who_metrics["weight_percentile"],
            z_score=who_metrics["weight_z_score"],
        ),
        arm_circumference=AnthropometricMeasurement(
            value=predictions["arm_circumference"],
            unit="cm",
            confidence=predictions["arm_circumference_confidence"],
        ),
        head_circumference=AnthropometricMeasurement(
            value=predictions["head_circumference"],
            unit="cm",
            confidence=predictions["head_circumference_confidence"],
        ),
        nutritional_assessment=nutritional_assessment,
        model_version=anthropometric_predictor.model_version,
        processing_time_seconds=time.time() - start_time,
    )

    return result


def combine_multi_scan_results(
    scan_results: Dict[str, PredictionResult], metadata: ScanMetadata
) -> PredictionResult:
    """Combine results from multiple scan angles for improved accuracy."""

    # Weight different scan types
    scan_weights = {"front": 0.4, "back": 0.3, "side_left": 0.15, "side_right": 0.15}

    combined_measurements = {}

    # Weighted average of measurements
    for measurement_type in [
        "height",
        "weight",
        "arm_circumference",
        "head_circumference",
    ]:
        values = []
        confidences = []
        weights = []

        for scan_type, result in scan_results.items():
            measurement = getattr(result, measurement_type)
            values.append(measurement.value)
            confidences.append(measurement.confidence)
            weights.append(scan_weights.get(scan_type, 0.1))

        # Calculate weighted averages
        weighted_value = np.average(values, weights=weights)
        weighted_confidence = np.average(confidences, weights=weights)

        combined_measurements[measurement_type] = {
            "value": weighted_value,
            "confidence": min(
                weighted_confidence * 1.1, 1.0
            ),  # Slight boost for multi-scan
        }

    # Recalculate WHO metrics with combined measurements
    who_metrics = who_standards.calculate_metrics(
        height_cm=combined_measurements["height"]["value"],
        weight_kg=combined_measurements["weight"]["value"],
        age_months=metadata.child_age_months,
        gender=metadata.child_gender,
    )

    # Assess nutritional status
    nutritional_assessment = assess_nutritional_status(who_metrics)

    # Create combined result
    return PredictionResult(
        height=AnthropometricMeasurement(
            value=combined_measurements["height"]["value"],
            unit="cm",
            confidence=combined_measurements["height"]["confidence"],
            percentile=who_metrics["height_percentile"],
            z_score=who_metrics["height_z_score"],
        ),
        weight=AnthropometricMeasurement(
            value=combined_measurements["weight"]["value"],
            unit="kg",
            confidence=combined_measurements["weight"]["confidence"],
            percentile=who_metrics["weight_percentile"],
            z_score=who_metrics["weight_z_score"],
        ),
        arm_circumference=AnthropometricMeasurement(
            value=combined_measurements["arm_circumference"]["value"],
            unit="cm",
            confidence=combined_measurements["arm_circumference"]["confidence"],
        ),
        head_circumference=AnthropometricMeasurement(
            value=combined_measurements["head_circumference"]["value"],
            unit="cm",
            confidence=combined_measurements["head_circumference"]["confidence"],
        ),
        nutritional_assessment=nutritional_assessment,
        model_version=anthropometric_predictor.model_version,
        processing_time_seconds=0,  # Will be set by caller
    )


def assess_nutritional_status(who_metrics: Dict) -> NutritionalAssessment:
    """Assess nutritional status based on WHO standards."""

    # WHO Z-score cutoffs
    def categorize_z_score(z_score: float) -> str:
        if z_score >= -1:
            return "normal"
        elif z_score >= -2:
            return "mild"
        elif z_score >= -3:
            return "moderate"
        else:
            return "severe"

    # Assess each indicator
    stunting_status = categorize_z_score(who_metrics.get("height_z_score", 0))
    wasting_status = categorize_z_score(who_metrics.get("wfh_z_score", 0))
    underweight_status = categorize_z_score(who_metrics.get("weight_z_score", 0))

    # Determine overall risk
    severe_conditions = [stunting_status, wasting_status, underweight_status].count(
        "severe"
    )
    moderate_conditions = [stunting_status, wasting_status, underweight_status].count(
        "moderate"
    )

    if severe_conditions > 0:
        overall_risk = "critical"
    elif moderate_conditions > 1:
        overall_risk = "high"
    elif (
        moderate_conditions > 0
        or [stunting_status, wasting_status, underweight_status].count("mild") > 1
    ):
        overall_risk = "medium"
    else:
        overall_risk = "low"

    # Generate recommendations
    recommendations = []
    if stunting_status in ["moderate", "severe"]:
        recommendations.append(
            "Immediate nutritional intervention required for stunting"
        )
    if wasting_status in ["moderate", "severe"]:
        recommendations.append("Urgent treatment needed for acute malnutrition")
    if underweight_status in ["moderate", "severe"]:
        recommendations.append("Weight monitoring and nutritional support required")
    if overall_risk == "low":
        recommendations.append("Continue regular growth monitoring")

    return NutritionalAssessment(
        stunting_status=stunting_status,
        wasting_status=wasting_status,
        underweight_status=underweight_status,
        overall_risk=overall_risk,
        recommendations=recommendations,
    )


async def cleanup_temp_file(file_path: str):
    """Clean up temporary files."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.error(f"Failed to clean up {file_path}: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
