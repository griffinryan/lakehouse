# Lakehouse Seattle - Firefly System Documentation

## 🌟 Project Overview

Lakehouse Seattle is an intimate live music venue website featuring an immersive Three.js-powered firefly animation system. The site creates a magical nighttime atmosphere with glowing fireflies, a procedurally generated tree, and a Van Gogh-inspired swirling background.

**Current Branch Status**: This documentation reflects the branch where fireflies work correctly with the SwirlingBackground implementation (not the VanGoghBackground from the experimental branch).

### Version Notes
- **Working Branch**: Uses `SwirlingBackground.js` with simple 2D shader effects
- **Experimental Branch**: Contains `VanGoghBackground.js` with complex 3D layered effects
- **Key Difference**: SwirlingBackground uses a single full-screen quad, while VanGoghBackground uses multiple 3D planes with parallax

## 🏗️ Architecture Overview

```
┌─────────────────────┐
│    index.html       │  ← Entry point, loads fireflies.js as ES6 module
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   fireflies.js      │  ← Initializes FireflySystem on DOM load
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  FireflySystem.js   │  ← Main orchestrator
├─────────────────────┤
│ • Scene setup       │
│ • Render pipeline   │
│ • Animation loop    │
│ • Event handling    │
└──────────┬──────────┘
           │
     ┌─────┴─────┬─────────┬──────────┐
     │           │         │          │
┌────▼────┐ ┌───▼───┐ ┌───▼───┐ ┌────▼────┐
│Firefly  │ │ Tree  │ │Swirling│ │ Shaders │
│  .js    │ │  .js  │ │Backgrnd│ │   .js   │
└─────────┘ └───────┘ └────────┘ └─────────┘
```

## 💻 Tech Stack

### Core Dependencies
- **Three.js** (v0.178.0) - 3D graphics library
- **WebGL** - Hardware-accelerated graphics
- **ES6 Modules** - Modern JavaScript module system
- **PostProcessing** - Three.js addons for bloom effects
- **live-server** - Development server (devDependency)

### File Structure
```
lakehouse/
├── index.html                    # Main HTML entry point
├── styles.css                    # Global styles
├── fireflies.js                  # Entry point for firefly system
├── package.json                  # Dependencies
├── node_modules/                 # Three.js and dependencies
└── firefly-system/               # Core animation system
    ├── FireflySystem.js          # Main controller
    ├── Firefly.js                # Individual firefly logic
    ├── SwirlingBackground.js     # Animated background
    ├── Tree.js                   # Procedural tree generator
    └── shaders/                  # GLSL shader files
        ├── fireflyShaders.js     # Firefly glow effects
        └── backgroundShaders.js  # Background swirl effects
```

## 🎯 Component Deep Dive

### FireflySystem.js - Main Controller

The heart of the animation system. Manages all visual elements and orchestrates the render pipeline.

**Key Responsibilities:**
- Three.js scene initialization
- Camera and renderer setup
- Post-processing pipeline (bloom)
- Component lifecycle management
- Animation loop
- Event handling

**Configuration Object:**
```javascript
this.config = {
    fireflyCount: 250,           // Number of fireflies to spawn
    fireflyScale: 1,             // Global scale multiplier
    mouseRadius: 200,            // Mouse interaction radius
    mouseForce: 0.5,             // Mouse repulsion strength
    environmentColor: 0x0a0a2e,  // Deep blue environment
    fogColor: 0x0a0a2e,         // Fog color for depth
    fogNear: 1,                  // Fog start distance
    fogFar: 1000,               // Fog end distance
    bloomStrength: 4.0,         // Bloom intensity
    bloomRadius: 1.2,           // Bloom spread
    bloomThreshold: 0.05        // Bloom activation threshold
};
```

**Rendering Pipeline:**
1. Clear previous frame
2. Render background scene (orthographic camera)
3. Render main scene with bloom post-processing
4. Uses `autoClear: false` for layered rendering

### Firefly.js - Individual Firefly Behavior

Each firefly is an autonomous entity with its own behavior patterns.

**Features:**
- Custom GLSL shaders for glow effect
- Realistic blinking patterns
- Sine-wave floating motion
- Mouse interaction (attraction/repulsion)
- Boundary wrapping for infinite space
- Individual personality traits (curiosity, speed)

**Key Properties:**
```javascript
{
    position: Vector3,        // Current 3D position
    originalPosition: Vector3, // Spawn position
    velocity: Vector3,        // Movement vector
    blinkOffset: Number,      // Unique blink timing
    blinkSpeed: Number,       // Blink frequency
    floatSpeed: Number,       // Floating animation speed
    floatRadius: Number,      // Float movement radius
    curiosity: Number,        // Mouse interaction strength
    color: Color              // HSL color (warm yellows-greens)
}
```

**Update Cycle:**
1. Update time-based animations
2. Apply floating behavior (sine waves)
3. Process blinking state machine
4. Calculate mouse interactions
5. Apply velocity and boundary wrapping

### SwirlingBackground.js - Animated Background

Creates a Van Gogh-inspired swirling night sky effect using screen-space shaders.

**Implementation:**
- Full-screen quad in separate scene
- Orthographic camera for 2D rendering
- Custom GLSL shaders with noise functions
- Multiple octaves of turbulence
- Time-based animation

**Shader Features:**
- Perlin noise for organic movement
- Layered turbulence patterns
- Color gradients (deep purples, blues, blacks)
- Swirling vortex effects
- Star field generation

### Tree.js - Procedural Tree Generator

Generates a realistic tree structure with firefly spawn points.

**Algorithm:**
- Recursive branch generation
- Natural branching angles
- Decreasing branch thickness
- Spawn point distribution
- Swaying animation

**Key Methods:**
```javascript
generateBranches(depth, parent, ...params)  // Recursive generation
getSpawnPoints()                            // Returns firefly positions
getBoundingBox()                           // For spatial queries
update(deltaTime)                          // Swaying animation
```

## 🎨 Shader System

### Firefly Shaders (fireflyShaders.js)

**Vertex Shader:**
- Standard MVP transformation
- Passes UV coordinates for circular shape

**Fragment Shader:**
- Radial gradient for glow effect
- Exponential falloff from center
- Intensity uniform for blinking
- Additive blending for luminosity

```glsl
// Core glow calculation
float dist = length(vUv - vec2(0.5));
float glow = exp(-dist * glowStrength);
gl_FragColor = vec4(color * intensity, glow);
```

### Background Shaders (backgroundShaders.js)

**Complex noise-based animation:**
- 3D Simplex noise implementation
- Multiple turbulence octaves
- Time-based evolution
- Vortex distortion fields

## 🎨 CSS Architecture

### Design System Variables
```css
:root {
    --lake-deep: #0a192f;      // Deepest blue
    --lake-mid: #172a45;       // Medium blue
    --lake-light: #2a4365;     // Light blue
    --sunset-gold: #fbbf24;    // Gold accents
    --sunset-orange: #f59e0b;  // Orange accents
    --cream: #fef3c7;          // Primary text
    --text-secondary: rgba(254, 243, 199, 0.8);
}
```

### Layout Strategy
- Fixed positioning for canvas (#particles)
- Relative positioning for content overlay
- Z-index management (canvas: 0, content: 1)
- Responsive design with viewport units
- Mobile-first approach

### Canvas Integration
```css
#particles {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;  // Allow clicking through
    opacity: 0.6;         // Subtle effect
}
```

## 🚀 Performance Optimizations

### Rendering Optimizations
- **Instanced Rendering**: Not yet implemented, but fireflies could benefit
- **Frustum Culling**: Manual boundary wrapping instead of culling
- **LOD System**: Single detail level currently
- **Render Order**: Background (-1000), Tree (0), Fireflies (1)

### Memory Management
- Geometry sharing (single sphere for all fireflies)
- Material cloning for individual properties
- Proper disposal methods for cleanup
- Event listener cleanup on destroy

### Animation Performance
- **Frame-independent movement**: `deltaTime` based updates
- **Boundary wrapping**: Avoids creating/destroying fireflies
- **Shader-based effects**: GPU-accelerated glow
- **Bloom pass**: Single pass for all glowing elements

## 🛠️ Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server (using live-server)
npm start
# or
npm run dev

# Alternative: Use npx serve
npm run serve

# Access at http://localhost:8080
```

### NPM Scripts
- `npm start` - Runs live-server on port 8080
- `npm run dev` - Same as start (alias)
- `npm run serve` - Uses npx serve as alternative

### Import Map Configuration
The project uses native ES6 modules with an import map in index.html:
```html
<script type="importmap">
{
    "imports": {
        "three": "./node_modules/three/build/three.module.js",
        "three/examples/jsm/": "./node_modules/three/examples/jsm/"
    }
}
</script>
```

### Debugging Tools
Available via browser console:
```javascript
window.fireflySystem           // Access to main system
fireflySystem.setConfig({...}) // Runtime configuration
fireflySystem.config          // View current config
fireflySystem.fireflies       // Access firefly array
```

## 🔧 Configuration & Customization

### Runtime Configuration
The system can be configured after initialization:
```javascript
fireflySystem.setConfig({
    fireflyCount: 300,
    bloomStrength: 5.0,
    mouseRadius: 250
});
```

### Visual Presets

**Magical Forest**:
```javascript
{
    fireflyCount: 400,
    fogColor: 0x001a00,
    bloomStrength: 4.5,
    environmentColor: 0x000500
}
```

**Deep Ocean**:
```javascript
{
    fireflyCount: 150,
    fogColor: 0x000033,
    bloomStrength: 3.0,
    fireflyScale: 0.8
}
```

**Sunset Garden**:
```javascript
{
    fireflyCount: 200,
    fogColor: 0x331100,
    bloomStrength: 5.0,
    environmentColor: 0x110500
}
```

## 🔄 Event System

### Mouse/Touch Interaction
- **Mouse Movement**: Updates `mouseWorld` position for firefly interactions
- **Touch Support**: Mobile-compatible touch events
- **Interaction Radius**: Configurable via `mouseRadius`
- **Force Strength**: Configurable via `mouseForce`

### Window Events
- **Resize**: Updates camera aspect ratio and renderer size
- **BeforeUnload**: Cleanup via `destroy()` method

## 🚦 Animation Loop

### Frame Update Sequence
1. Request next animation frame
2. Calculate deltaTime via Three.Clock
3. Update background animation
4. Update tree swaying
5. Update each firefly
6. Clear renderer
7. Render background scene
8. Render main scene with bloom

### Time Management
- Uses Three.Clock for accurate deltaTime
- Frame-independent animations
- No fixed timestep (variable frame rate)

## 📦 Future Extension Points

### Planned Features
1. **Weather System**: Rain, wind effects
2. **Day/Night Cycle**: Dynamic lighting changes
3. **Sound Integration**: Audio-reactive fireflies
4. **Particle Effects**: Pollen, dust motes
5. **Interactive Elements**: Clickable fireflies

### Architecture Extensions
1. **Component Plugin System**: Register custom elements
2. **Preset Manager**: Save/load configurations
3. **Performance Modes**: Quality settings
4. **Debug UI**: dat.GUI integration
5. **Analytics**: Performance tracking

### Code Quality Improvements
1. **TypeScript Migration**: Type safety
2. **Unit Tests**: Component testing
3. **E2E Tests**: Visual regression
4. **Documentation**: JSDoc comments
5. **Build Pipeline**: Webpack/Vite setup

## 🐛 Known Issues & Workarounds

### Current Limitations
1. **Performance on Mobile**: Consider reducing firefly count
2. **Memory Usage**: ~50-100MB for full scene
3. **Safari Compatibility**: Requires WebGL2 support
4. **Initial Load**: ~2-3 second initialization

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Requires iOS 15+ / macOS 12+
- **Mobile**: Reduced firefly count recommended

## 🎯 Best Practices

### Performance Guidelines
1. Keep firefly count under 500 for smooth 60fps
2. Adjust bloom settings based on device capability
3. Use fog to hide distant objects
4. Monitor memory usage via Chrome DevTools

### Code Organization
1. One class per file
2. Shader code in separate files
3. Configuration object pattern
4. Event cleanup in destroy methods
5. Consistent naming conventions

### Future Development
1. Always test on low-end devices
2. Profile before optimizing
3. Maintain backwards compatibility
4. Document configuration changes
5. Version shader modifications

## 📝 Maintenance Notes

### Regular Tasks
1. Update Three.js version carefully (breaking changes)
2. Test across browsers quarterly
3. Profile performance with each feature
4. Update documentation with changes
5. Tag releases for rollback capability

### Monitoring
- Use browser DevTools Performance tab
- Check memory leaks with heap snapshots
- Monitor frame rate with Stats.js
- Test on various screen sizes
- Validate mobile touch interactions

## 🎨 Visual Design Philosophy

The Lakehouse Seattle firefly system creates an intimate, magical atmosphere that mirrors the venue's philosophy of "where festival meets living room." The visual elements work together to create:

1. **Depth and Atmosphere**: Fog and parallax create spatial depth
2. **Organic Movement**: Nothing moves in straight lines
3. **Warm Lighting**: Fireflies provide cozy illumination
4. **Living Environment**: Everything subtly animates
5. **Interactive Magic**: Mouse/touch brings the scene to life

## 🚀 Quick Reference

### Common Tasks

**Change number of fireflies:**
```javascript
window.fireflySystem.setConfig({ fireflyCount: 300 });
```

**Adjust glow intensity:**
```javascript
window.fireflySystem.setConfig({ bloomStrength: 5.0 });
```

**Change fog/atmosphere:**
```javascript
window.fireflySystem.setConfig({ 
    fogColor: 0x001122,
    fogNear: 10,
    fogFar: 800 
});
```

**Debug animations:**
```javascript
// Check if animations are running
console.log(window.fireflySystem.frameCount);
// Should increment continuously
```

### Troubleshooting

**Fireflies not moving:**
1. Check browser console for errors
2. Verify `fireflySystem.clock` exists
3. Ensure `animate()` is being called
4. Check deltaTime values aren't 0

**Black background:**
1. Verify CSS sets body background
2. Check canvas opacity (should be < 1)
3. Ensure renderer clear color is set
4. Verify SwirlingBackground shaders loaded

**Poor performance:**
1. Reduce firefly count
2. Lower bloom settings
3. Disable background animation
4. Check GPU acceleration in browser

**Build issues:**
1. Run `npm install` to get dependencies
2. Ensure Three.js version matches (0.178.0)
3. Check import map in index.html
4. Verify file paths are correct

### Adding New Features

**New visual element:**
1. Create class in firefly-system/
2. Import in FireflySystem.js
3. Add to create/update/destroy lifecycle
4. Set appropriate render order

**New configuration option:**
1. Add to `this.config` object
2. Implement in `setConfig()` method
3. Use in relevant update methods
4. Document default value

**New shader effect:**
1. Create shader file in shaders/
2. Export vertex/fragment shaders
3. Import in component file
4. Apply to material

---

*This documentation reflects the current working state of the firefly system. For experimental features (like VanGoghBackground), refer to feature branch documentation.*

*Last updated: Current working branch with SwirlingBackground implementation*