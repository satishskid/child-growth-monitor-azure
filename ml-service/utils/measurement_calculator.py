"""
Measurement Calculator for Child Growth Monitor
Calculates anthropometric measurements from pose estimation data.
"""

import numpy as np
import logging
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)


class MeasurementCalculator:
    """Calculate anthropometric measurements from pose keypoints."""
    
    def __init__(self):
        # Camera calibration parameters (would be set during calibration)
        self.focal_length = 800.0  # Approximate focal length in pixels
        self.camera_height = 1.5   # Default camera height in meters
        self.pixel_to_cm_ratio = 0.1  # Default ratio, refined during measurement
        
    def calculate_measurements(self, pose_results: List[Dict], scan_type: str, age_months: int) -> Dict:
        """
        Calculate anthropometric measurements from pose sequence.
        
        Args:
            pose_results: List of pose estimation results
            scan_type: Type of scan ('front', 'back', 'side_left', 'side_right')
            age_months: Child age in months for scale reference
            
        Returns:
            Dictionary of calculated measurements
        """
        try:
            if not pose_results:
                return {}
            
            # Filter valid poses
            valid_poses = [p for p in pose_results if p.get('pose_present', False)]
            
            if not valid_poses:
                logger.warning("No valid poses found for measurement calculation")
                return {}
            
            # Calculate measurements based on scan type
            measurements = {}
            
            if scan_type in ['front', 'back']:
                measurements.update(self._calculate_frontal_measurements(valid_poses))
            elif scan_type in ['side_left', 'side_right']:
                measurements.update(self._calculate_lateral_measurements(valid_poses))
            
            # Add common measurements
            measurements.update(self._calculate_common_measurements(valid_poses))
            
            # Apply age-based scaling corrections
            measurements = self._apply_age_corrections(measurements, age_months)
            
            # Add measurement quality scores
            measurements['measurement_quality'] = self._assess_measurement_quality(valid_poses)
            
            return measurements
            
        except Exception as e:
            logger.error(f"Error calculating measurements: {str(e)}")
            return {}
    
    def _calculate_frontal_measurements(self, pose_results: List[Dict]) -> Dict:
        """Calculate measurements from frontal view poses."""
        measurements = {}
        
        try:
            # Extract keypoints from best quality poses
            best_poses = sorted(pose_results, key=lambda x: x.get('quality_score', 0), reverse=True)[:5]
            
            for pose in best_poses:
                keypoints = np.array(pose.get('keypoints', []))
                if len(keypoints) == 0:
                    continue
                
                # MediaPipe pose landmark indices
                # 0: nose, 11: left_shoulder, 12: right_shoulder
                # 23: left_hip, 24: right_hip, 27: left_ankle, 28: right_ankle
                
                if len(keypoints) > 28:
                    # Calculate shoulder width
                    left_shoulder = keypoints[11][:2]
                    right_shoulder = keypoints[12][:2]
                    if left_shoulder[0] > 0 and right_shoulder[0] > 0:
                        shoulder_width_px = np.linalg.norm(left_shoulder - right_shoulder)
                        measurements['shoulder_width'] = shoulder_width_px * self.pixel_to_cm_ratio
                    
                    # Calculate hip width
                    left_hip = keypoints[23][:2]
                    right_hip = keypoints[24][:2]
                    if left_hip[0] > 0 and right_hip[0] > 0:
                        hip_width_px = np.linalg.norm(left_hip - right_hip)
                        measurements['hip_width'] = hip_width_px * self.pixel_to_cm_ratio
                    
                    # Calculate approximate height (head to feet)
                    nose = keypoints[0][:2]
                    left_ankle = keypoints[27][:2]
                    right_ankle = keypoints[28][:2]
                    
                    if nose[1] > 0 and (left_ankle[1] > 0 or right_ankle[1] > 0):
                        # Use the ankle that's more visible/confident
                        if left_ankle[1] > 0 and right_ankle[1] > 0:
                            ankle = (left_ankle + right_ankle) / 2
                        elif left_ankle[1] > 0:
                            ankle = left_ankle
                        else:
                            ankle = right_ankle
                        
                        height_px = abs(ankle[1] - nose[1])
                        measurements['head_to_ground_distance'] = height_px * self.pixel_to_cm_ratio
                
                break  # Use only the best pose for frontal measurements
            
        except Exception as e:
            logger.error(f"Error in frontal measurements: {str(e)}")
        
        return measurements
    
    def _calculate_lateral_measurements(self, pose_results: List[Dict]) -> Dict:
        """Calculate measurements from lateral (side) view poses."""
        measurements = {}
        
        try:
            # Extract keypoints from best quality poses
            best_poses = sorted(pose_results, key=lambda x: x.get('quality_score', 0), reverse=True)[:5]
            
            for pose in best_poses:
                keypoints = np.array(pose.get('keypoints', []))
                if len(keypoints) == 0:
                    continue
                
                if len(keypoints) > 28:
                    # Calculate depth measurements (front to back)
                    # Use shoulder and hip landmarks for body depth
                    left_shoulder = keypoints[11]
                    right_shoulder = keypoints[12]
                    
                    # In lateral view, one shoulder will be more visible
                    visible_shoulder = left_shoulder if left_shoulder[3] > right_shoulder[3] else right_shoulder
                    
                    if visible_shoulder[3] > 0.5:  # Good visibility
                        # Estimate body depth using pose 3D coordinates if available
                        if len(visible_shoulder) > 3:
                            depth_estimate = abs(visible_shoulder[2]) * 100  # Convert to cm
                            measurements['body_depth'] = depth_estimate
                    
                    # Calculate profile measurements
                    nose = keypoints[0]
                    left_ear = keypoints[7]
                    right_ear = keypoints[8]
                    
                    # Head circumference approximation from profile
                    visible_ear = left_ear if left_ear[3] > right_ear[3] else right_ear
                    
                    if nose[3] > 0.5 and visible_ear[3] > 0.5:
                        head_width_px = abs(nose[0] - visible_ear[0])
                        # Head circumference ≈ π × head_width (simplified)
                        measurements['head_circumference_ratio'] = head_width_px * self.pixel_to_cm_ratio * np.pi
                
                break  # Use only the best pose for lateral measurements
            
        except Exception as e:
            logger.error(f"Error in lateral measurements: {str(e)}")
        
        return measurements
    
    def _calculate_common_measurements(self, pose_results: List[Dict]) -> Dict:
        """Calculate measurements common to all scan types."""
        measurements = {}
        
        try:
            # Average across multiple good poses
            good_poses = [p for p in pose_results if p.get('quality_score', 0) > 0.6]
            
            if not good_poses:
                good_poses = pose_results[:3]  # Use best available
            
            arm_lengths = []
            leg_lengths = []
            torso_lengths = []
            
            for pose in good_poses:
                keypoints = np.array(pose.get('keypoints', []))
                if len(keypoints) == 0:
                    continue
                
                if len(keypoints) > 28:
                    # Calculate arm length (shoulder to wrist)
                    left_shoulder = keypoints[11][:2]
                    left_elbow = keypoints[13][:2]
                    left_wrist = keypoints[15][:2]
                    
                    if all(pt[0] > 0 for pt in [left_shoulder, left_elbow, left_wrist]):
                        upper_arm = np.linalg.norm(left_shoulder - left_elbow)
                        forearm = np.linalg.norm(left_elbow - left_wrist)
                        arm_length_px = upper_arm + forearm
                        arm_lengths.append(arm_length_px * self.pixel_to_cm_ratio)
                    
                    # Calculate leg length (hip to ankle)
                    left_hip = keypoints[23][:2]
                    left_knee = keypoints[25][:2]
                    left_ankle = keypoints[27][:2]
                    
                    if all(pt[0] > 0 for pt in [left_hip, left_knee, left_ankle]):
                        thigh = np.linalg.norm(left_hip - left_knee)
                        shin = np.linalg.norm(left_knee - left_ankle)
                        leg_length_px = thigh + shin
                        leg_lengths.append(leg_length_px * self.pixel_to_cm_ratio)
                    
                    # Calculate torso length (shoulder to hip)
                    left_shoulder = keypoints[11][:2]
                    left_hip = keypoints[23][:2]
                    
                    if left_shoulder[0] > 0 and left_hip[0] > 0:
                        torso_length_px = np.linalg.norm(left_shoulder - left_hip)
                        torso_lengths.append(torso_length_px * self.pixel_to_cm_ratio)
            
            # Average the measurements
            if arm_lengths:
                measurements['arm_length'] = np.median(arm_lengths)
            if leg_lengths:
                measurements['leg_length'] = np.median(leg_lengths)
            if torso_lengths:
                measurements['torso_length'] = np.median(torso_lengths)
            
        except Exception as e:
            logger.error(f"Error in common measurements: {str(e)}")
        
        return measurements
    
    def _apply_age_corrections(self, measurements: Dict, age_months: int) -> Dict:
        """Apply age-based corrections to measurements."""
        try:
            # Age-based scaling factors (based on typical child proportions)
            if age_months < 12:
                # Infants have different proportions
                head_scale = 1.2
                limb_scale = 0.9
            elif age_months < 24:
                # Toddlers
                head_scale = 1.1
                limb_scale = 0.95
            else:
                # Older children
                head_scale = 1.0
                limb_scale = 1.0
            
            corrected = measurements.copy()
            
            # Apply corrections
            if 'head_circumference_ratio' in corrected:
                corrected['head_circumference_ratio'] *= head_scale
            
            for key in ['arm_length', 'leg_length']:
                if key in corrected:
                    corrected[key] *= limb_scale
            
            return corrected
            
        except Exception as e:
            logger.error(f"Error applying age corrections: {str(e)}")
            return measurements
    
    def _assess_measurement_quality(self, pose_results: List[Dict]) -> float:
        """Assess the quality of measurements based on pose quality."""
        try:
            if not pose_results:
                return 0.0
            
            # Calculate average pose quality
            quality_scores = [p.get('quality_score', 0) for p in pose_results]
            avg_quality = np.mean(quality_scores)
            
            # Bonus for having multiple good poses
            good_poses = sum(1 for q in quality_scores if q > 0.7)
            consistency_bonus = min(good_poses / 5.0, 0.2)  # Up to 20% bonus
            
            # Penalty for too few poses
            if len(pose_results) < 3:
                quantity_penalty = 0.1 * (3 - len(pose_results))
            else:
                quantity_penalty = 0.0
            
            final_quality = avg_quality + consistency_bonus - quantity_penalty
            
            return max(0.0, min(final_quality, 1.0))
            
        except Exception as e:
            logger.error(f"Error assessing measurement quality: {str(e)}")
            return 0.5
    
    def calibrate_scale(self, known_measurement: float, measured_pixels: float) -> float:
        """
        Calibrate pixel-to-cm ratio using a known measurement.
        
        Args:
            known_measurement: Known measurement in cm
            measured_pixels: Corresponding measurement in pixels
            
        Returns:
            Updated pixel-to-cm ratio
        """
        if measured_pixels > 0:
            new_ratio = known_measurement / measured_pixels
            # Smooth the ratio update to avoid sudden changes
            self.pixel_to_cm_ratio = 0.7 * self.pixel_to_cm_ratio + 0.3 * new_ratio
            logger.info(f"Updated pixel-to-cm ratio to {self.pixel_to_cm_ratio:.4f}")
            return self.pixel_to_cm_ratio
        
        return self.pixel_to_cm_ratio
    
    def set_camera_parameters(self, focal_length: float, camera_height: float):
        """Set camera calibration parameters."""
        self.focal_length = focal_length
        self.camera_height = camera_height
        logger.info(f"Updated camera parameters: focal_length={focal_length}, height={camera_height}")
    
    def get_measurement_confidence(self, measurement_name: str, value: float, age_months: int) -> float:
        """Calculate confidence score for a specific measurement."""
        # Expected ranges based on age (very simplified)
        expected_ranges = {
            'shoulder_width': (8 + age_months * 0.3, 15 + age_months * 0.3),
            'hip_width': (6 + age_months * 0.25, 12 + age_months * 0.25),
            'arm_length': (10 + age_months * 0.8, 25 + age_months * 0.8),
            'leg_length': (15 + age_months * 1.2, 40 + age_months * 1.2),
            'head_to_ground_distance': (40 + age_months * 1.5, 80 + age_months * 1.5)
        }
        
        if measurement_name not in expected_ranges:
            return 0.8  # Default confidence
        
        min_val, max_val = expected_ranges[measurement_name]
        
        if min_val <= value <= max_val:
            return 0.9  # High confidence
        elif value < min_val * 0.7 or value > max_val * 1.3:
            return 0.3  # Low confidence - measurement seems unrealistic
        else:
            return 0.6  # Medium confidence - measurement is plausible but outside normal range
