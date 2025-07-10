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
        fireflyCount: 180,    // Increased from 120 for more side particles
        fogColor: 0x0a0a2e,
        fogNear: 50,
        fogFar: 600,
        bloomStrength: 3.5,
        bloomRadius: 1.2,
        bloomThreshold: 0.0,
        mouseRadius: 200,     // Increased for wider orbital effect
        mouseForce: 0.5       // Slightly stronger mouse force
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        fireflySystem.destroy();
    });
    
    // Add click handlers for band links
    document.querySelectorAll('.band-name[data-url]').forEach(band => {
        if (band.dataset.url !== '#') {
            band.style.cursor = 'pointer';
            band.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(band.dataset.url, '_blank');
            });
        }
    });
    
    // TextSwirl animations disabled to prevent conflicts with MouseFollowText
    // Keeping this code commented for future reference
    /*
    const addSwirlInteractions = () => {
        // Band names swirl on hover
        document.querySelectorAll('.band-name').forEach(band => {
            band.addEventListener('mouseenter', (e) => {
                if (fireflySystem.textSwirl && !fireflySystem.textSwirl.isElementSwirling(band)) {
                    fireflySystem.textSwirl.createSwirlFromElement(band);
                }
            });
        });
        
        // Venue name swirls on click
        const venueName = document.querySelector('.venue-name');
        if (venueName) {
            venueName.style.cursor = 'pointer';
            venueName.addEventListener('click', (e) => {
                if (fireflySystem.textSwirl && !fireflySystem.textSwirl.isElementSwirling(venueName)) {
                    fireflySystem.textSwirl.createSwirlFromElement(venueName, {
                        particlesPerLetter: 25,
                        swirlRadius: 120,
                        swirlDuration: 3.5,
                        particleSize: 3.5
                    });
                }
            });
        }
        
        // Date display swirls on hover
        const dateDisplay = document.querySelector('.date-display');
        if (dateDisplay) {
            dateDisplay.addEventListener('mouseenter', (e) => {
                if (fireflySystem.textSwirl && !fireflySystem.textSwirl.isElementSwirling(dateDisplay)) {
                    fireflySystem.textSwirl.createSwirlFromElement(dateDisplay, {
                        particlesPerLetter: 20,
                        swirlRadius: 90,
                        swirlSpeed: 2.5
                    });
                }
            });
        }
        
        // Random automatic swirls
        setInterval(() => {
            if (fireflySystem.textSwirl) {
                fireflySystem.textSwirl.triggerRandomSwirl();
            }
        }, 8000); // Every 8 seconds
    };
    
    // Initialize swirl interactions after a short delay to ensure everything is loaded
    setTimeout(addSwirlInteractions, 500);
    */
    
    // Initialize mouse follow text effects
    const initMouseFollowText = () => {
        if (!fireflySystem.mouseFollowText) return;
        
        // REMOVED: venue name and band names from mouse follow
        // Only keeping date display and tagline with tighter orbital radius
        
        // Add date display with tighter orbital effect
        const dateDisplay = document.querySelector('.date-display');
        if (dateDisplay) {
            fireflySystem.mouseFollowText.addElement(dateDisplay, {
                influenceRadius: 120,      // Reduced from 200
                springStiffness: 0.15,     // Increased for tighter orbit
                maxDisplacement: 60,       // Reduced from 100
                returnForce: 0.12,         // Increased for tighter return
                stickiness: 0.35,          // Increased for more magnetic feel
                damping: 0.85,             // Reduced for more responsive movement
                minDistance: 20            // Reduced for tighter orbit
            });
        }
        
        // Add tagline with tighter orbital effect
        const tagline = document.querySelector('.tagline');
        if (tagline) {
            fireflySystem.mouseFollowText.addElement(tagline, {
                influenceRadius: 100,      // Reduced from 180
                springStiffness: 0.12,     // Increased from 0.08
                maxDisplacement: 50,       // Reduced from 80
                damping: 0.88,             // Reduced from 0.93
                stickiness: 0.25,          // Increased from 0.15
                returnForce: 0.10,         // Increased for tighter return
                minDistance: 15            // Added for tighter orbit
            });
        }
    };
    
    // Initialize mouse follow after a delay
    setTimeout(initMouseFollowText, 600);
});