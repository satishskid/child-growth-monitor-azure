"""
Video Processing utilities for Child Growth Monitor
Handles video frame extraction, preprocessing, and pose sequence processing.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class VideoProcessor:
    """Process video files for pose estimation and measurement extraction."""

    def __init__(self):
        self.target_fps = 10  # Process every 3rd frame at 30fps
        self.max_frames = 100  # Maximum frames to process
        self.min_frame_quality = 0.3  # Minimum quality threshold

    def process_video(self, video_path: str) -> Tuple[List[np.ndarray], List[Dict]]:
        """
        Process video file and extract frames with pose data.

        Args:
            video_path: Path to video file

        Returns:
            Tuple of (frames, pose_results)
        """
        try:
            cap = cv2.VideoCapture(video_path)

            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {video_path}")

            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0

            logger.info(
                f"Processing video: {fps:.1f}fps, {total_frames} frames, {duration:.1f}s"
            )

            # Calculate frame sampling
            frame_skip = max(1, int(fps / self.target_fps))
            max_frames_to_process = min(self.max_frames, total_frames // frame_skip)

            frames = []
            pose_results = []
            frame_count = 0
            processed_count = 0

            # Import here to avoid circular imports
            from models.pose_estimator import PoseEstimator

            pose_estimator = PoseEstimator()

            while cap.isOpened() and processed_count < max_frames_to_process:
                ret, frame = cap.read()

                if not ret:
                    break

                # Skip frames to match target FPS
                if frame_count % frame_skip != 0:
                    frame_count += 1
                    continue

                # Preprocess frame
                processed_frame = self._preprocess_frame(frame)

                if processed_frame is not None:
                    # Estimate pose
                    pose_result = pose_estimator.estimate_pose(processed_frame)
                    pose_result["timestamp"] = frame_count / fps
                    pose_result["frame_index"] = frame_count

                    # Only keep frames with good pose detection
                    if pose_result["quality_score"] >= self.min_frame_quality:
                        frames.append(processed_frame)
                        pose_results.append(pose_result)
                        processed_count += 1

                frame_count += 1

            cap.release()
            pose_estimator.cleanup()

            logger.info(
                f"Processed {len(frames)} frames from {frame_count} total frames"
            )

            return frames, pose_results

        except Exception as e:
            logger.error(f"Error processing video {video_path}: {str(e)}")
            return [], []

    def _preprocess_frame(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Preprocess video frame for better pose estimation.

        Args:
            frame: Input frame

        Returns:
            Preprocessed frame or None if frame should be skipped
        """
        try:
            # Check frame quality
            if frame is None or frame.size == 0:
                return None

            # Resize if too large (improves processing speed)
            height, width = frame.shape[:2]
            max_dimension = 1080

            if max(height, width) > max_dimension:
                scale = max_dimension / max(height, width)
                new_width = int(width * scale)
                new_height = int(height * scale)
                frame = cv2.resize(
                    frame, (new_width, new_height), interpolation=cv2.INTER_AREA
                )

            # Enhance contrast and brightness if needed
            frame = self._enhance_image_quality(frame)

            # Check if frame is too dark or too bright
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            mean_brightness = np.mean(gray)

            if mean_brightness < 50 or mean_brightness > 200:
                logger.debug(
                    f"Frame brightness {mean_brightness:.1f} may affect pose detection"
                )

            return frame

        except Exception as e:
            logger.error(f"Error preprocessing frame: {str(e)}")
            return None

    def _enhance_image_quality(self, frame: np.ndarray) -> np.ndarray:
        """Enhance image quality for better pose detection."""
        try:
            # Convert to LAB color space
            lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)

            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l_channel = clahe.apply(l_channel)

            # Merge channels and convert back to BGR
            lab = cv2.merge([l_channel, a_channel, b_channel])
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

            return enhanced

        except Exception as e:
            logger.debug(f"Image enhancement failed: {str(e)}")
            return frame

    def extract_key_frames(self, pose_results: List[Dict]) -> List[int]:
        """
        Extract indices of key frames with best pose quality.

        Args:
            pose_results: List of pose estimation results

        Returns:
            List of frame indices sorted by quality
        """
        if not pose_results:
            return []

        # Score frames based on pose quality and completeness
        frame_scores = []

        for i, pose_result in enumerate(pose_results):
            score = pose_result.get("quality_score", 0.0)

            # Bonus for frames with all key landmarks visible
            if "visibility_scores" in pose_result:
                visibility = pose_result["visibility_scores"]
                key_landmarks_visible = sum(1 for v in visibility if v > 0.5)
                if key_landmarks_visible >= 20:  # Most landmarks visible
                    score *= 1.2

            frame_scores.append((i, score))

        # Sort by score (descending) and return top frame indices
        frame_scores.sort(key=lambda x: x[1], reverse=True)

        # Return top 10 frames or all if fewer
        top_frames = [idx for idx, score in frame_scores[:10]]

        return top_frames

    def smooth_pose_sequence(self, pose_results: List[Dict]) -> List[Dict]:
        """
        Apply temporal smoothing to pose sequence to reduce jitter.

        Args:
            pose_results: List of pose estimation results

        Returns:
            Smoothed pose results
        """
        if len(pose_results) < 3:
            return pose_results

        smoothed_results = []
        window_size = 5  # Smoothing window

        for i, pose_result in enumerate(pose_results):
            if not pose_result.get("pose_present", False):
                smoothed_results.append(pose_result)
                continue

            # Get smoothing window
            start_idx = max(0, i - window_size // 2)
            end_idx = min(len(pose_results), i + window_size // 2 + 1)

            # Collect valid keypoints in window
            valid_keypoints = []
            for j in range(start_idx, end_idx):
                if pose_results[j].get("pose_present", False):
                    keypoints = pose_results[j].get("keypoints", [])
                    if keypoints:
                        valid_keypoints.append(np.array(keypoints))

            if len(valid_keypoints) >= 2:
                # Apply median filtering
                stacked_keypoints = np.stack(valid_keypoints, axis=0)
                smoothed_keypoints = np.median(stacked_keypoints, axis=0)

                # Create smoothed result
                smoothed_result = pose_result.copy()
                smoothed_result["keypoints"] = smoothed_keypoints.tolist()
                smoothed_results.append(smoothed_result)
            else:
                smoothed_results.append(pose_result)

        return smoothed_results

    def validate_video_quality(self, video_path: str) -> Dict:
        """
        Validate video quality for pose estimation.

        Args:
            video_path: Path to video file

        Returns:
            Dictionary with quality metrics and recommendations
        """
        try:
            cap = cv2.VideoCapture(video_path)

            if not cap.isOpened():
                return {
                    "valid": False,
                    "error": "Could not open video file",
                    "recommendations": ["Check file format and path"],
                }

            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0

            recommendations = []
            warnings = []

            # Check resolution
            if width < 640 or height < 480:
                warnings.append("Low resolution may affect pose detection accuracy")
                recommendations.append("Use higher resolution camera if possible")

            # Check frame rate
            if fps < 15:
                warnings.append("Low frame rate may miss important poses")
                recommendations.append("Use at least 15 FPS for better results")

            # Check duration
            if duration < 5:
                warnings.append("Video too short for reliable measurements")
                recommendations.append("Record for at least 5-10 seconds")
            elif duration > 30:
                warnings.append("Very long video may slow processing")
                recommendations.append(
                    "Keep videos under 30 seconds for faster processing"
                )

            # Sample a few frames to check quality
            sample_frames = []
            for i in range(0, min(total_frames, 30), 10):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                if ret:
                    sample_frames.append(frame)

            cap.release()

            # Analyze sample frames
            if sample_frames:
                avg_brightness = np.mean(
                    [
                        np.mean(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
                        for f in sample_frames
                    ]
                )

                if avg_brightness < 80:
                    warnings.append("Video appears dark")
                    recommendations.append("Ensure good lighting conditions")
                elif avg_brightness > 180:
                    warnings.append("Video appears overexposed")
                    recommendations.append("Reduce lighting or adjust camera exposure")

            return {
                "valid": True,
                "properties": {
                    "width": width,
                    "height": height,
                    "fps": fps,
                    "duration": duration,
                    "total_frames": total_frames,
                },
                "warnings": warnings,
                "recommendations": recommendations,
            }

        except Exception as e:
            return {
                "valid": False,
                "error": str(e),
                "recommendations": ["Check video file integrity"],
            }
