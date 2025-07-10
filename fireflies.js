// Import the FireflySystem using ES6 modules
import { FireflySystem } from './firefly-system/FireflySystem.js';

// Initialize the firefly system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create firefly system with custom configuration
    const fireflySystem = new FireflySystem(document.body);
    
    // Expose to window for debugging/configuration
    window.fireflySystem = fireflySystem;
    
    // Custom configuration for Van Gogh-inspired night
    fireflySystem.setConfig({
        fireflyCount: 120,
        fogColor: 0x0a0a2e,
        fogNear: 50,
        fogFar: 600,
        bloomStrength: 3.5,
        bloomRadius: 1.2,
        bloomThreshold: 0.0,
        mouseRadius: 150,
        mouseForce: 0.4
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        fireflySystem.destroy();
    });
});