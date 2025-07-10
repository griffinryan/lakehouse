# Firefly Particle Animation System

A stunning, reusable Three.js-based firefly particle system with realistic behaviors and beautiful visual effects.

## Features

- 🌟 Realistic firefly behaviors (lazy floating, smooth blinking)
- 🖱️ Interactive mouse effects with swirling motion
- ✨ Beautiful glow effects with HDR bloom
- 🎨 Customizable colors and atmosphere
- 📱 Mobile-optimized performance
- 🔧 Easy configuration and integration

## Quick Start

```javascript
import { FireflySystem } from './firefly-system/FireflySystem.js';

// Create firefly system
const fireflySystem = new FireflySystem();

// Custom configuration
fireflySystem.setConfig({
    fireflyCount: 200,
    environmentColor: 0x0a0a2e,
    bloomStrength: 3.0
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fireflyCount` | Number | 200 | Number of fireflies |
| `fireflyScale` | Number | 1 | Global scale multiplier |
| `environmentColor` | Hex | 0x0a0a2e | Background color |
| `fogColor` | Hex | 0x0a0a2e | Fog color |
| `fogNear` | Number | 1 | Fog start distance |
| `fogFar` | Number | 1000 | Fog end distance |
| `bloomStrength` | Number | 2.5 | Bloom intensity |
| `bloomRadius` | Number | 0.8 | Bloom spread |
| `bloomThreshold` | Number | 0.1 | Brightness threshold |
| `mouseRadius` | Number | 200 | Mouse influence radius |
| `mouseForce` | Number | 0.5 | Mouse interaction strength |

## Presets

```javascript
// Summer night
fireflySystem.setConfig({
    fireflyCount: 200,
    environmentColor: 0x0a0a2e,
    bloomStrength: 3.0,
    fogNear: 100,
    fogFar: 800
});

// Magical forest
fireflySystem.setConfig({
    fireflyCount: 300,
    environmentColor: 0x0a1f0a,
    bloomStrength: 5.0,
    fogNear: 20,
    fogFar: 500
});

// Winter twilight
fireflySystem.setConfig({
    fireflyCount: 100,
    environmentColor: 0x1a1a3e,
    bloomStrength: 4.0,
    mouseForce: 0.3
});
```

## Integration Examples

### React

```jsx
import { useEffect, useRef } from 'react';
import { FireflySystem } from './firefly-system/FireflySystem.js';

function FireflyBackground() {
    const containerRef = useRef();
    const systemRef = useRef();
    
    useEffect(() => {
        systemRef.current = new FireflySystem(containerRef.current);
        
        return () => {
            systemRef.current.destroy();
        };
    }, []);
    
    return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
```

### Vue

```vue
<template>
    <div ref="container" class="firefly-container"></div>
</template>

<script>
import { FireflySystem } from './firefly-system/FireflySystem.js';

export default {
    mounted() {
        this.fireflySystem = new FireflySystem(this.$refs.container);
    },
    beforeDestroy() {
        this.fireflySystem.destroy();
    }
}
</script>
```

## Architecture

```
firefly-system/
├── FireflySystem.js      # Main controller class
├── Firefly.js           # Individual firefly behavior
├── shaders/             # GLSL shaders for effects
│   └── fireflyShaders.js
└── README.md            # This file
```

## Performance

- Uses GPU instancing for thousands of fireflies
- Automatic LOD based on distance
- Mobile-optimized with progressive enhancement
- Efficient spatial partitioning for interactions

## License

ISC License