"""
Pose Estimation Model for Child Growth Monitor
Uses MediaPipe and custom models for 3D pose estimation from video frames.
"""

import numpy as np
import cv2
import mediapipe as mp
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class PoseEstimator:
    """3D pose estimation using MediaPipe and depth estimation."""
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.is_loaded = True
        logger.info("PoseEstimator initialized")
    
    def estimate_pose(self, image: np.ndarray) -> Dict:
        """
        Estimate 3D pose from a single image frame.
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            Dictionary containing keypoints, quality score, and metadata
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(rgb_image)
            
            if not results.pose_landmarks:
                return {
                    'keypoints': [],
                    'timestamp': 0.0,
                    'quality_score': 0.0,
                    'landmarks_3d': [],
                    'visibility_scores': []
                }
            
            # Extract 2D landmarks
            landmarks_2d = []
            visibility_scores = []
            
            for landmark in results.pose_landmarks.landmark:
                landmarks_2d.append([
                    landmark.x * image.shape[1],  # Convert to pixel coordinates
                    landmark.y * image.shape[0],
                    landmark.visibility
                ])
                visibility_scores.append(landmark.visibility)
            
            # Extract 3D landmarks if available
            landmarks_3d = []
            if results.pose_world_landmarks:
                for landmark in results.pose_world_landmarks.landmark:
                    landmarks_3d.append([
                        landmark.x,
                        landmark.y,
                        landmark.z,
                        landmark.visibility
                    ])
            
            # Calculate quality score based on visibility and pose completeness
            quality_score = self._calculate_quality_score(visibility_scores, landmarks_2d)
            
            # Format keypoints for consistency
            keypoints = self._format_keypoints(landmarks_2d, landmarks_3d)
            
            return {
                'keypoints': keypoints,
                'timestamp': 0.0,  # Will be set by video processor
                'quality_score': quality_score,
                'landmarks_3d': landmarks_3d,
                'visibility_scores': visibility_scores,
                'pose_present': True
            }
            
        except Exception as e:
            logger.error(f"Error in pose estimation: {str(e)}")
            return {
                'keypoints': [],
                'timestamp': 0.0,
                'quality_score': 0.0,
                'landmarks_3d': [],
                'visibility_scores': [],
                'pose_present': False
            }
    
    def estimate_poses_batch(self, images: List[np.ndarray]) -> List[Dict]:
        """
        Process multiple images for pose estimation.
        
        Args:
            images: List of input images
            
        Returns:
            List of pose estimation results
        """
        results = []
        for i, image in enumerate(images):
            pose_result = self.estimate_pose(image)
            pose_result['timestamp'] = i / 30.0  # Assume 30 FPS
            results.append(pose_result)
        
        return results
    
    def _calculate_quality_score(self, visibility_scores: List[float], landmarks_2d: List[List[float]]) -> float:
        """Calculate pose quality score based on visibility and completeness."""
        if not visibility_scores:
            return 0.0
        
        # Key landmarks for child measurement (simplified MediaPipe indices)
        key_landmarks = [0, 11, 12, 23, 24, 25, 26, 27, 28]  # Head, shoulders, hips, knees, ankles
        
        # Calculate average visibility for key landmarks
        key_visibility = []
        for idx in key_landmarks:
            if idx < len(visibility_scores):
                key_visibility.append(visibility_scores[idx])
        
        if not key_visibility:
            return 0.0
        
        avg_visibility = np.mean(key_visibility)
        
        # Penalize if too few key landmarks are visible
        visible_key_landmarks = sum(1 for v in key_visibility if v > 0.5)
        completeness_factor = visible_key_landmarks / len(key_landmarks)
        
        # Combine visibility and completeness
        quality_score = avg_visibility * completeness_factor
        
        return min(quality_score, 1.0)
    
    def _format_keypoints(self, landmarks_2d: List[List[float]], landmarks_3d: List[List[float]]) -> List[List[float]]:
        """Format keypoints for measurement calculation."""
        keypoints = []
        
        for i, landmark_2d in enumerate(landmarks_2d):
            if i < len(landmarks_3d):
                # Combine 2D and 3D information
                keypoint = [
                    landmark_2d[0],  # x (pixels)
                    landmark_2d[1],  # y (pixels)
                    landmarks_3d[i][2] if landmarks_3d[i][2] != 0 else 0.0,  # z (normalized)
                    landmark_2d[2]   # confidence
                ]
            else:
                # 2D only
                keypoint = [
                    landmark_2d[0],
                    landmark_2d[1],
                    0.0,
                    landmark_2d[2]
                ]
            
            keypoints.append(keypoint)
        
        return keypoints
    
    def get_key_measurements_landmarks(self) -> Dict[str, List[int]]:
        """Get landmark indices for key anthropometric measurements."""
        return {
            'height': [0, 27, 28],  # Head top, left ankle, right ankle
            'shoulder_width': [11, 12],  # Left shoulder, right shoulder
            'hip_width': [23, 24],  # Left hip, right hip
            'head_size': [0, 9, 10],  # Nose, left ear, right ear
            'arm_length': [11, 13, 15],  # Left shoulder, elbow, wrist
            'leg_length': [23, 25, 27]  # Left hip, knee, ankle
        }
    
    def extract_measurement_points(self, pose_result: Dict) -> Dict[str, np.ndarray]:
        """Extract specific measurement points from pose estimation."""
        if not pose_result['pose_present'] or not pose_result['keypoints']:
            return {}
        
        keypoints = np.array(pose_result['keypoints'])
        measurement_landmarks = self.get_key_measurements_landmarks()
        measurement_points = {}
        
        for measurement_name, landmark_indices in measurement_landmarks.items():
            points = []
            for idx in landmark_indices:
                if idx < len(keypoints) and keypoints[idx][3] > 0.5:  # Check confidence
                    points.append(keypoints[idx][:3])  # x, y, z
            
            if points:
                measurement_points[measurement_name] = np.array(points)
        
        return measurement_points
    
    def cleanup(self):
        """Clean up MediaPipe resources."""
        if hasattr(self, 'pose'):
            self.pose.close()
        logger.info("PoseEstimator cleanup completed")
