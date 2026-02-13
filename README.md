# ✋ Gestura ML - Touchless Interface Control

![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)
![CV](https://img.shields.io/badge/Computer_Vision-OpenCV%20%7C%20MediaPipe-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> **Real-time hand gesture recognition system for touchless Human-Computer Interaction (HCI).**

---

## 📋 Executive Summary

**Gestura ML** enables users to control digital interfaces using intuitive hand movements. By leveraging **Google MediaPipe** for skeletal hand tracking and a custom **CNN (Convolutional Neural Network)** for gesture classification, it achieves low-latency performance suitable for gaming, media control, and accessibility assistive devices.

### Key Capabilities
- **Real-Time Tracking**: 21-point 3D hand landmarks detection at 30+ FPS on CPU.
- **Custom Gestures**: Pre-trained support for Swipe, Pinch, Fist, and Open Palm actions.
- **OS Integration**: Map gestures to system volume, brightness, or mouse cursor movements.
- **Lightweight**: Optimized to run on edge devices and standard webcams.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    subgraph Input
        Webcam[Video Feed] --> Resize[Frame Preprocessing]
    end

    subgraph Vision Pipeline
        Resize --> MediaPipe[MediaPipe Hands]
        MediaPipe --> Landmarks[XYZ Coordinates]
    end

    subgraph Logic
        Landmarks --> FeatureExtraction[Relative Distance/Angle Calc]
        FeatureExtraction --> Classifier[LSTM/CNN Classifier]
        Classifier --> Action[Detected Gesture]
    end

    subgraph Output
        Action --> OS[System Controller (PyAutoGUI)]
        Action --> UI[Overlay Feedback]
    end
```

---

## 🚀 Roadmap

- [x] Basic Landmark Detection
- [ ] Dynamic Gesture Recognition (Sequence Modeling)
- [ ] Custom Gesture Recording Tool
- [ ] Unity/Unreal Engine Plugin

---

## 👨‍💻 Author

**Soham Barate (Goddex-123)**
*Senior AI Engineer & Data Scientist*

[LinkedIn](https://linkedin.com/in/soham-barate-7429181a9) | [GitHub](https://github.com/goddex-123)
