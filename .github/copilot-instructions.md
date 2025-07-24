<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Child Growth Monitor Development Instructions

This is a comprehensive Child Growth Monitor application for detecting child malnutrition using smartphone technology and machine learning.

## Project Structure

- `mobile-app/`: React Native mobile application for 3D child scanning
- `backend/`: Flask API backend with Azure integration
- `ml-service/`: Machine learning models and processing pipeline
- `shared/`: Shared TypeScript types and utilities
- `docs/`: Documentation and setup guides

## Key Technologies

- **Mobile**: React Native, Expo, ARCore/ARKit for 3D scanning
- **Backend**: Python Flask, PostgreSQL, Azure services
- **ML**: TensorFlow/PyTorch, OpenCV, 3D pose estimation
- **Cloud**: Azure B2C, Azure ML, Azure Storage

## Development Guidelines

1. Follow ethical data handling practices - all child data must be handled with utmost care
2. Implement offline-first approach for mobile app (rural connectivity)
3. Ensure GDPR compliance and proper consent management
4. Use TypeScript for type safety across components
5. Implement comprehensive error handling and logging
6. Follow accessibility guidelines for healthcare applications

## Security & Privacy

- All data must be encrypted in transit and at rest
- Implement proper consent workflows with QR code verification
- Anonymize data before ML processing
- Follow healthcare data protection standards

## Testing

- Unit tests for all critical functions
- Integration tests for API endpoints
- ML model validation with test datasets
- Mobile app testing on various devices

When generating code, prioritize:

1. Child safety and data protection
2. Accessibility for healthcare workers in remote areas
3. Offline functionality
4. Performance optimization for mobile devices
5. Clear error messages and user guidance
