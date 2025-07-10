// Import the FireflySystem using ES6 modules
import { FireflySystem } from './firefly-system/FireflySystem.js';

// Initialize the firefly system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create firefly system with custom configuration
    const fireflySystem = new FireflySystem(document.body);
    
    // Expose to window for debugging/configuration
    window.fireflySystem = fireflySystem;
    
    // Custom configuration for summer night fireflies
    fireflySystem.setConfig({
        fireflyCount: 150,
        environmentColor: 0x0a0a2e, // Deep night blue
        fogColor: 0x0a0a2e,
        fogNear: 100,
        fogFar: 800,
        bloomStrength: 3.0,
        bloomRadius: 1.0,
        bloomThreshold: 0.0,
        mouseRadius: 150,
        mouseForce: 0.4
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        fireflySystem.destroy();
    });
});