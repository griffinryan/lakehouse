# Lakehouse Seattle - Interactive Firefly Experience

An immersive web experience featuring interactive fireflies, a procedurally generated tree, and a Van Gogh-inspired swirling night sky. Built with Three.js and WebGL.

## 🌟 Features

- **Interactive Fireflies**: Hundreds of glowing fireflies that respond to mouse/touch interactions
- **Procedural Tree**: Dynamically generated tree structure with swaying animation
- **Animated Background**: Van Gogh-inspired swirling night sky with custom shaders
- **Responsive Design**: Mobile-friendly with touch support
- **Performance Optimized**: GPU-accelerated effects with configurable quality settings

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lakehouse.git
cd lakehouse
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:

```bash
npm start
# or
npm run dev
```

The site will be available at `http://localhost:8080`

Alternative server option:
```bash
npm run serve
```

## 🛠️ Tech Stack

- **Three.js** (v0.178.0) - 3D graphics and animations
- **WebGL** - Hardware-accelerated graphics
- **ES6 Modules** - Modern JavaScript module system
- **Custom GLSL Shaders** - For firefly glow and background effects

## 📁 Project Structure

```
lakehouse/
├── index.html              # Main entry point
├── styles.css              # Global styles
├── fireflies.js            # Firefly system initialization
├── firefly-system/         # Core animation components
│   ├── FireflySystem.js    # Main controller
│   ├── Firefly.js          # Individual firefly behavior
│   ├── Tree.js             # Procedural tree generator
│   ├── SwirlingBackground.js # Animated background
│   └── shaders/            # GLSL shader files
└── package.json            # Dependencies and scripts
```

## 🎮 Runtime Configuration

Access the firefly system via browser console:

```javascript
// Adjust firefly count
window.fireflySystem.setConfig({ fireflyCount: 300 });

// Change bloom intensity
window.fireflySystem.setConfig({ bloomStrength: 5.0 });

// Modify mouse interaction
window.fireflySystem.setConfig({ 
    mouseRadius: 250,
    mouseForce: 0.7 
});
```

## 📱 Browser Support

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Requires iOS 15+ / macOS 12+
- Mobile: Optimized with reduced firefly count

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for Lakehouse Seattle