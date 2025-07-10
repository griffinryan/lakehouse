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
    
    // Add swirl animations to text elements
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
});