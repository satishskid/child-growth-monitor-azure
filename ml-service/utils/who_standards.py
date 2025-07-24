"""
WHO Growth Standards implementation for Child Growth Monitor
Calculates percentiles, z-scores, and nutritional status based on WHO standards.
"""

import numpy as np
import logging
from typing import Dict, Optional, Tuple
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class WHOStandards:
    """Calculate WHO growth percentiles and z-scores for child anthropometric measurements."""
    
    def __init__(self):
        self.standards_loaded = False
        self.growth_tables = {}
        
        # Try to load WHO standards data
        self._load_who_standards()
        
        # If no data files found, use approximations
        if not self.standards_loaded:
            logger.warning("WHO standards data not found. Using approximations.")
            self._initialize_approximations()
    
    def _load_who_standards(self):
        """Load WHO growth standards from data files."""
        try:
            # Look for WHO standards data files
            data_dir = Path(__file__).parent.parent / 'data' / 'who_standards'
            
            if data_dir.exists():
                # Load height-for-age, weight-for-age, etc. tables
                standard_files = {
                    'height_for_age': data_dir / 'height_for_age.json',
                    'weight_for_age': data_dir / 'weight_for_age.json',
                    'weight_for_height': data_dir / 'weight_for_height.json',
                    'head_circumference_for_age': data_dir / 'head_circumference_for_age.json'
                }
                
                for standard_name, file_path in standard_files.items():
                    if file_path.exists():
                        with open(file_path, 'r') as f:
                            self.growth_tables[standard_name] = json.load(f)
                        logger.info(f"Loaded {standard_name} WHO standards")
                
                self.standards_loaded = len(self.growth_tables) > 0
            
        except Exception as e:
            logger.error(f"Error loading WHO standards: {str(e)}")
            self.standards_loaded = False
    
    def _initialize_approximations(self):
        """Initialize WHO standard approximations for when data files are not available."""
        # These are simplified approximations of WHO growth standards
        # In a production system, actual WHO data tables should be used
        
        self.growth_approximations = {
            'height_for_age': {
                'male': {
                    # Linear approximation: height_cm ≈ birth_length + monthly_increment * age_months
                    'birth_length': 49.9,
                    'monthly_increment': 1.2,  # Decreases with age
                    'std_dev': 2.0
                },
                'female': {
                    'birth_length': 49.1,
                    'monthly_increment': 1.1,
                    'std_dev': 2.0
                }
            },
            'weight_for_age': {
                'male': {
                    'birth_weight': 3.3,
                    'monthly_increment': 0.4,  # Decreases with age
                    'std_dev': 0.8
                },
                'female': {
                    'birth_weight': 3.2,
                    'monthly_increment': 0.38,
                    'std_dev': 0.75
                }
            }
        }
        
        logger.info("Initialized WHO standards approximations")
    
    def calculate_metrics(self, height_cm: float, weight_kg: float, age_months: int, gender: str) -> Dict:
        """
        Calculate WHO percentiles and z-scores for given measurements.
        
        Args:
            height_cm: Child height in centimeters
            weight_kg: Child weight in kilograms
            age_months: Child age in months
            gender: Child gender ('male' or 'female')
            
        Returns:
            Dictionary containing percentiles and z-scores
        """
        try:
            metrics = {}
            
            # Height-for-age
            height_metrics = self._calculate_height_for_age(height_cm, age_months, gender)
            metrics.update(height_metrics)
            
            # Weight-for-age
            weight_metrics = self._calculate_weight_for_age(weight_kg, age_months, gender)
            metrics.update(weight_metrics)
            
            # Weight-for-height
            wfh_metrics = self._calculate_weight_for_height(weight_kg, height_cm, gender)
            metrics.update(wfh_metrics)
            
            # BMI if needed
            bmi = weight_kg / ((height_cm / 100) ** 2)
            metrics['bmi'] = bmi
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating WHO metrics: {str(e)}")
            return {}
    
    def _calculate_height_for_age(self, height_cm: float, age_months: int, gender: str) -> Dict:
        """Calculate height-for-age percentile and z-score."""
        try:
            if self.standards_loaded and 'height_for_age' in self.growth_tables:
                # Use actual WHO data
                return self._lookup_who_table('height_for_age', height_cm, age_months, gender)
            else:
                # Use approximation
                return self._approximate_height_for_age(height_cm, age_months, gender)
        except Exception as e:
            logger.error(f"Error calculating height-for-age: {str(e)}")
            return {'height_percentile': 50, 'height_z_score': 0.0}
    
    def _calculate_weight_for_age(self, weight_kg: float, age_months: int, gender: str) -> Dict:
        """Calculate weight-for-age percentile and z-score."""
        try:
            if self.standards_loaded and 'weight_for_age' in self.growth_tables:
                # Use actual WHO data
                return self._lookup_who_table('weight_for_age', weight_kg, age_months, gender)
            else:
                # Use approximation
                return self._approximate_weight_for_age(weight_kg, age_months, gender)
        except Exception as e:
            logger.error(f"Error calculating weight-for-age: {str(e)}")
            return {'weight_percentile': 50, 'weight_z_score': 0.0}
    
    def _calculate_weight_for_height(self, weight_kg: float, height_cm: float, gender: str) -> Dict:
        """Calculate weight-for-height percentile and z-score."""
        try:
            # Simplified weight-for-height calculation
            # In reality, this uses WHO weight-for-height tables
            
            # Expected weight based on height (simplified formula)
            if gender == 'male':
                expected_weight = 0.045 * height_cm - 1.8
            else:
                expected_weight = 0.042 * height_cm - 1.6
            
            # Calculate z-score
            std_dev = 0.8  # Simplified standard deviation
            z_score = (weight_kg - expected_weight) / std_dev
            
            # Convert z-score to percentile
            percentile = self._z_score_to_percentile(z_score)
            
            return {
                'wfh_percentile': percentile,
                'wfh_z_score': z_score,
                'wfh_expected': expected_weight
            }
            
        except Exception as e:
            logger.error(f"Error calculating weight-for-height: {str(e)}")
            return {'wfh_percentile': 50, 'wfh_z_score': 0.0}
    
    def _approximate_height_for_age(self, height_cm: float, age_months: int, gender: str) -> Dict:
        """Approximate height-for-age using simplified formulas."""
        try:
            params = self.growth_approximations['height_for_age'][gender]
            
            # Expected height with decreasing monthly increment
            monthly_increment = params['monthly_increment'] * (1 - age_months * 0.005)  # Decreases with age
            expected_height = params['birth_length'] + monthly_increment * age_months
            
            # Calculate z-score
            z_score = (height_cm - expected_height) / params['std_dev']
            
            # Convert to percentile
            percentile = self._z_score_to_percentile(z_score)
            
            return {
                'height_percentile': percentile,
                'height_z_score': z_score,
                'height_expected': expected_height
            }
            
        except Exception as e:
            logger.error(f"Error in height-for-age approximation: {str(e)}")
            return {'height_percentile': 50, 'height_z_score': 0.0}
    
    def _approximate_weight_for_age(self, weight_kg: float, age_months: int, gender: str) -> Dict:
        """Approximate weight-for-age using simplified formulas."""
        try:
            params = self.growth_approximations['weight_for_age'][gender]
            
            # Expected weight with decreasing monthly increment
            monthly_increment = params['monthly_increment'] * (1 - age_months * 0.008)  # Decreases with age
            expected_weight = params['birth_weight'] + monthly_increment * age_months
            
            # Calculate z-score
            z_score = (weight_kg - expected_weight) / params['std_dev']
            
            # Convert to percentile
            percentile = self._z_score_to_percentile(z_score)
            
            return {
                'weight_percentile': percentile,
                'weight_z_score': z_score,
                'weight_expected': expected_weight
            }
            
        except Exception as e:
            logger.error(f"Error in weight-for-age approximation: {str(e)}")
            return {'weight_percentile': 50, 'weight_z_score': 0.0}
    
    def _lookup_who_table(self, table_name: str, measurement: float, age_months: int, gender: str) -> Dict:
        """Look up actual WHO table data (placeholder for real implementation)."""
        # This would implement actual WHO table lookup
        # For now, fall back to approximations
        if table_name == 'height_for_age':
            return self._approximate_height_for_age(measurement, age_months, gender)
        elif table_name == 'weight_for_age':
            return self._approximate_weight_for_age(measurement, age_months, gender)
        else:
            return {}
    
    def _z_score_to_percentile(self, z_score: float) -> float:
        """Convert z-score to percentile using normal distribution."""
        try:
            # Using the error function approximation for normal distribution
            # percentile = 50 * (1 + erf(z_score / sqrt(2)))
            
            # Simplified approximation
            if z_score <= -3:
                return 0.1
            elif z_score >= 3:
                return 99.9
            else:
                # Linear approximation in the middle range
                percentile = 50 + (z_score * 34.13)  # ~34.13% per standard deviation
                return max(0.1, min(99.9, percentile))
                
        except Exception as e:
            logger.error(f"Error converting z-score to percentile: {str(e)}")
            return 50.0
    
    def classify_nutritional_status(self, z_score: float, measurement_type: str) -> str:
        """
        Classify nutritional status based on WHO cutoffs.
        
        Args:
            z_score: Z-score for the measurement
            measurement_type: Type of measurement ('height', 'weight', 'wfh')
            
        Returns:
            Status classification ('normal', 'mild', 'moderate', 'severe')
        """
        try:
            # WHO cutoffs for malnutrition
            if z_score >= -1:
                return 'normal'
            elif z_score >= -2:
                return 'mild'
            elif z_score >= -3:
                return 'moderate'
            else:
                return 'severe'
                
        except Exception as e:
            logger.error(f"Error classifying nutritional status: {str(e)}")
            return 'unknown'
    
    def get_growth_velocity(self, current_measurement: float, previous_measurement: float, 
                          days_between: int, measurement_type: str) -> Dict:
        """
        Calculate growth velocity between measurements.
        
        Args:
            current_measurement: Current measurement value
            previous_measurement: Previous measurement value
            days_between: Days between measurements
            measurement_type: Type of measurement ('height' or 'weight')
            
        Returns:
            Dictionary with velocity metrics
        """
        try:
            if days_between <= 0:
                return {'velocity': 0, 'status': 'invalid_interval'}
            
            # Calculate velocity
            change = current_measurement - previous_measurement
            
            if measurement_type == 'height':
                # Height velocity in cm/month
                velocity_per_month = (change / days_between) * 30.44
                
                # Expected velocity ranges (simplified)
                if velocity_per_month >= 0.8:
                    status = 'normal'
                elif velocity_per_month >= 0.4:
                    status = 'slow'
                else:
                    status = 'very_slow'
                    
                unit = 'cm/month'
                
            elif measurement_type == 'weight':
                # Weight velocity in kg/month
                velocity_per_month = (change / days_between) * 30.44
                
                # Expected velocity ranges (simplified)
                if velocity_per_month >= 0.2:
                    status = 'normal'
                elif velocity_per_month >= 0.1:
                    status = 'slow'
                else:
                    status = 'very_slow'
                    
                unit = 'kg/month'
            else:
                return {'velocity': 0, 'status': 'unknown_type'}
            
            return {
                'velocity': velocity_per_month,
                'velocity_per_day': change / days_between,
                'total_change': change,
                'status': status,
                'unit': unit,
                'days_interval': days_between
            }
            
        except Exception as e:
            logger.error(f"Error calculating growth velocity: {str(e)}")
            return {'velocity': 0, 'status': 'error'}
    
    def generate_growth_recommendations(self, metrics: Dict, age_months: int) -> List[str]:
        """Generate nutritional recommendations based on WHO metrics."""
        recommendations = []
        
        try:
            # Height-for-age recommendations
            height_z = metrics.get('height_z_score', 0)
            if height_z < -2:
                recommendations.append("Child shows signs of stunting. Ensure adequate nutrition and monitor growth closely.")
                if height_z < -3:
                    recommendations.append("Severe stunting detected. Seek immediate nutritional intervention.")
            
            # Weight-for-age recommendations
            weight_z = metrics.get('weight_z_score', 0)
            if weight_z < -2:
                recommendations.append("Child is underweight. Increase caloric intake and protein-rich foods.")
                if weight_z < -3:
                    recommendations.append("Severe underweight. Immediate medical attention required.")
            
            # Weight-for-height recommendations
            wfh_z = metrics.get('wfh_z_score', 0)
            if wfh_z < -2:
                recommendations.append("Child shows signs of wasting. Focus on nutrient-dense foods.")
                if wfh_z < -3:
                    recommendations.append("Severe acute malnutrition. Emergency treatment needed.")
            elif wfh_z > 2:
                recommendations.append("Child may be overweight. Ensure balanced nutrition and physical activity.")
            
            # Age-specific recommendations
            if age_months < 6:
                recommendations.append("Exclusive breastfeeding recommended until 6 months.")
            elif age_months < 24:
                recommendations.append("Continue breastfeeding while introducing complementary foods.")
                recommendations.append("Ensure iron-rich foods to prevent anemia.")
            
            # General recommendations if no specific issues
            if not recommendations:
                recommendations.append("Child's growth appears normal. Continue regular monitoring.")
                recommendations.append("Maintain balanced nutrition and regular health check-ups.")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return ["Consult healthcare provider for personalized recommendations."]
