// Example of using the FireflySystem as an abstracted, reusable component

import { FireflySystem } from './firefly-system/FireflySystem.js';

// Basic usage with default settings
const basicSystem = new FireflySystem();

// Advanced usage with custom configuration
const customSystem = new FireflySystem(document.getElementById('custom-container'));

// Configure the system
customSystem.setConfig({
    // Firefly properties
    fireflyCount: 200,               // Number of fireflies
    fireflyScale: 1.2,               // Global scale multiplier
    
    // Environment settings
    environmentColor: 0x001122,      // Background color (dark blue)
    fogColor: 0x001122,              // Fog color
    fogNear: 50,                     // Fog start distance
    fogFar: 1000,                    // Fog end distance
    
    // Post-processing bloom
    bloomStrength: 2.5,              // Bloom intensity
    bloomRadius: 0.8,                // Bloom spread
    bloomThreshold: 0.1,             // Brightness threshold for bloom
    
    // Mouse interaction
    mouseRadius: 200,                // Radius of mouse influence
    mouseForce: 0.6                  // Strength of mouse interaction
});

// Programmatic control examples
function examples() {
    // Change environment to twilight
    customSystem.setConfig({
        environmentColor: 0x1a1a3e,
        fogColor: 0x1a1a3e,
        bloomStrength: 3.5
    });
    
    // Create a winter night effect
    customSystem.setConfig({
        environmentColor: 0x0a0a1f,
        bloomStrength: 4.0,
        fireflyCount: 100  // Fewer fireflies in winter
    });
    
    // Create a magical forest effect
    customSystem.setConfig({
        environmentColor: 0x0a1f0a,
        fogNear: 20,
        fogFar: 500,
        bloomStrength: 5.0,
        fireflyCount: 300
    });
}

// Event-driven examples
document.addEventListener('sunset', () => {
    customSystem.setConfig({
        bloomStrength: 4.0,
        environmentColor: 0x1a0a2e
    });
});

document.addEventListener('midnight', () => {
    customSystem.setConfig({
        bloomStrength: 5.0,
        environmentColor: 0x000011
    });
});

// Integration with other libraries
class FireflyController {
    constructor() {
        this.system = new FireflySystem();
        this.presets = {
            summer: {
                fireflyCount: 200,
                environmentColor: 0x0a0a2e,
                bloomStrength: 3.0
            },
            autumn: {
                fireflyCount: 150,
                environmentColor: 0x1a0a0a,
                bloomStrength: 2.5
            },
            magical: {
                fireflyCount: 300,
                environmentColor: 0x1a0a3e,
                bloomStrength: 5.0,
                bloomRadius: 1.2
            }
        };
    }
    
    applyPreset(presetName) {
        if (this.presets[presetName]) {
            this.system.setConfig(this.presets[presetName]);
        }
    }
    
    setIntensity(value) {
        // Adjust overall intensity (0-1)
        this.system.setConfig({
            bloomStrength: value * 5,
            fireflyCount: Math.floor(value * 300)
        });
    }
    
    setMood(mood) {
        const moods = {
            calm: { mouseForce: 0.2, bloomStrength: 2.0 },
            active: { mouseForce: 0.8, bloomStrength: 4.0 },
            dreamy: { mouseForce: 0.1, bloomStrength: 6.0 }
        };
        
        if (moods[mood]) {
            this.system.setConfig(moods[mood]);
        }
    }
}

// Usage in React/Vue/other frameworks
export function createFireflyBackground(container, options = {}) {
    const system = new FireflySystem(container);
    system.setConfig(options);
    
    return {
        system,
        setConfig: (config) => system.setConfig(config),
        destroy: () => system.destroy()
    };
}

// NPM package style export
export { FireflySystem };