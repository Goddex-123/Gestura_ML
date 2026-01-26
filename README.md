# Gestura: AI Sign Language Interface 🤟

> Real-time sign language translation powered by Computer Vision and Deep Learning. Features a futuristic cyberpunk UI with live webcam detection, LSTM-based gesture recognition, and Text-to-Speech output.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.14-FF6F00?logo=tensorflow)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-4285F4?logo=google)
[![Demo](https://img.shields.io/badge/🚀_Live-Demo-brightgreen)](https://goddex-123.github.io/Gestura_ML/)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🎥 **Real-Time Detection** - Live webcam with MediaPipe skeleton tracking
- 🧠 **LSTM Neural Network** - Temporal sequence analysis for accurate gesture recognition
- 🗣️ **Text-to-Speech** - Automatic voice output of detected signs
- 🌟 **Cyberpunk UI** - Glassmorphism, neon effects, and smooth animations
- 🎮 **Demo Mode** - Try the interface without training a model

## 🖼️ Preview

![Gestura Interface](docs/preview.png)

## 🚀 Live Demo

🔗 **[Launch Gestura AI Interface](https://goddex-123.github.io/Gestura_ML/)**  
_(Works in Demo Mode without backend!)_

## 🛠️ Quick Start

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
Gestura/
├── backend/          # FastAPI WebSocket server
├── public/           # Static assets
├── src/              # Next.js frontend source
├── next.config.ts    # Deployment configuration
└── package.json
```

## 📄 License

MIT License - feel free to use for your own projects!

---

**Built with 💜 using AI-assisted development**
