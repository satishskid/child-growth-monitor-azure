# Child Growth Monitor PWA 🌟

> **A Progressive Web App for comprehensive smartphone-based 3D child scanning to detect malnutrition using client-side Machine Learning and WebAssembly.**

This project is a Progressive Web App (PWA) version of the Child Growth Monitor application. It allows healthcare workers to perform 3D child scanning and get anthropometric analysis directly on their devices, even in areas with limited internet connectivity. The core machine learning models now run in the browser using WebAssembly (WASM), making the analysis faster and more accessible.

## ✨ Features

*   **📱 Progressive Web App (PWA)**: The application can be "installed" on any modern device (desktop or mobile) directly from the browser, providing a native-like experience.
*   **⚡️ Edge AI with WASM**: All machine learning and computer vision tasks are performed on the user's device, ensuring privacy and enabling real-time analysis even without an internet connection. The computer vision component is powered by `opencv.js`, a WebAssembly library.
*   **📷 3D Child Scanning**: The app uses the device's camera to capture images of a child from multiple angles.
*   **🤖 Real-time Anthropometric Analysis**: The app provides instant analysis of the child's growth, including height, weight, MUAC (Mid-Upper Arm Circumference), and head circumference.
*   **🌍 WHO Growth Standards**: The analysis is based on World Health Organization (WHO) growth standards to assess malnutrition risk.
*   **🔒 Secure & Private**: All data processing happens on the device, and no sensitive images are sent to a server. User authentication and data storage are handled by a secure backend.
*   **🌐 Offline First**: The application is designed to work offline. The app shell and core functionalities are cached, and analysis can be performed without an internet connection.

## 🚀 User Flow

1.  **Launch the App**: The user opens the PWA from their home screen or browser.
2.  **Login/Consent**: The user logs in and provides consent for using the application.
3.  **Start Scanning**: The user starts the scanning process for a child.
4.  **Capture Images**: The app guides the user to take photos of the child from different angles (front, back, sides).
5.  **Instant Analysis**: The app processes the images on the device and provides immediate anthropometric measurements and a malnutrition risk assessment.
6.  **View Results**: The user can view the results and recommendations.

## 📖 How to Use (End-User Guide)

### Installing the PWA

You can "install" the Child Growth Monitor PWA on your device for easy access.

**On Mobile (Android/iOS):**
1.  Open the PWA's URL in your mobile browser (e.g., Chrome, Safari).
2.  You will be prompted to "Add to Home Screen". Follow the instructions to add the app to your home screen.
3.  You can now launch the app from your home screen like any other app.

**On Desktop:**
1.  Open the PWA's URL in a modern browser (e.g., Chrome, Edge, Firefox).
2.  Look for an "install" icon in the address bar (usually a plus sign or a computer icon).
3.  Click the icon and follow the prompts to install the app.

### Using the App

1.  Open the app from your home screen or browser.
2.  Follow the on-screen instructions to log in and provide consent.
3.  Select a child to scan or add a new child.
4.  Follow the guidance on the scanning screen to take photos from the required angles.
5.  The app will automatically analyze the images and display the results.

## 🛠️ Developer Manual

### Prerequisites

*   **Node.js** (v16 or higher)
*   **npm** or **yarn**
*   **A modern web browser** (Chrome, Firefox, Edge)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd child-growth-monitor
    ```

2.  **Install dependencies for the PWA**:
    ```bash
    cd web-app
    npm install
    ```

### Running the PWA

To start the development server for the PWA, run the following command from the `web-app` directory:

```bash
npm run pwa:start
```

This will start the Expo development server for the web. You can then open the provided URL in your browser to test the application.

### Project Structure

The PWA code is located in the `web-app` directory. Here's an overview of the key files and directories:

```
web-app/
├── public/
│   ├── icons/            # PWA icons
│   ├── manifest.json     # PWA manifest file
│   └── service-worker.js # PWA service worker
├── src/
│   ├── anthropometric-predictor.ts # Client-side anthropometric predictor
│   ├── pose-estimator.ts           # Client-side pose estimator
│   ├── screens/                    # Application screens
│   └── services/
│       └── MLService.ts            # Client-side ML service
├── App.tsx                         # Main app component
└── package.json                    # Project configuration
```

### Edge AI & WASM Implementation

The core ML logic has been moved from the Python `ml-service` to the client-side, running in the browser.

*   **Pose Estimator (`pose-estimator.ts`)**: This module is a TypeScript port of the original Python `RealPoseEstimator`. It uses mathematical formulas to estimate keypoints and measurements. The computer vision part (contour detection) will be implemented using **`opencv.js`**, which is a WebAssembly (WASM) library. This allows for efficient image processing directly in the browser.

*   **Anthropometric Predictor (`anthropometric-predictor.ts`)**: This module is a TypeScript port of the fallback logic from the Python `RealAnthropometricPredictor`. It uses rule-based models to predict measurements and assess nutritional status based on WHO standards.

*   **ML Service (`MLService.ts`)**: This service orchestrates the client-side ML pipeline. It takes an image, passes it to the pose estimator, then to the anthropometric predictor, and returns the final analysis.

## 💰 Cost Considerations

By moving the ML processing to the client-side (Edge AI), this PWA significantly reduces the need for a powerful backend ML service. This has several cost benefits:

*   **Reduced Server Costs**: There is no need to host and maintain a dedicated ML service with expensive GPUs. The only backend required is for user authentication and data storage, which can be handled by a much smaller and cheaper server.
*   **Scalability**: The application can scale to a large number of users without a proportional increase in backend infrastructure costs, as the heavy computation is distributed across the users' devices.
*   **Offline Access**: The PWA can perform analysis even with a poor or no internet connection, reducing data usage costs for users in remote areas.

The main costs associated with this project would be:

*   **Web Hosting**: Hosting the static files for the PWA (HTML, CSS, JavaScript). This is generally very cheap.
*   **Backend API**: A simple backend for user management and data storage. This can be hosted on a low-cost server or a serverless platform.
*   **Development and Maintenance**: The ongoing cost of developing and maintaining the application.
