// Test script to verify UI avoidance functionality
// Run this in the browser console after the site loads

function testUIAvoidance() {
    console.log('=== UI Avoidance Test ===');
    
    // Check if fireflySystem is available
    if (!window.fireflySystem) {
        console.error('FireflySystem not found!');
        return;
    }
    
    const fs = window.fireflySystem;
    
    // Test 1: Check if UIBoundaryManager is initialized
    console.log('1. UIBoundaryManager initialized:', !!fs.uiBoundaryManager);
    
    // Test 2: Check boundaries detected
    if (fs.uiBoundaryManager) {
        console.log('2. UI boundaries detected:', fs.uiBoundaryManager.boundaries.length);
        console.log('   Boundaries:', fs.uiBoundaryManager.boundaries);
    }
    
    // Test 3: Check firefly configuration
    console.log('3. UI avoidance enabled:', fs.config.uiAvoidanceEnabled);
    console.log('   Avoidance strength:', fs.config.uiAvoidanceStrength);
    console.log('   Boundary padding:', fs.config.uiBoundaryPadding);
    
    // Test 4: Check if fireflies have UI avoidance
    const firefliesWithAvoidance = fs.fireflies.filter(f => f.options.uiBoundaryManager !== null);
    console.log('4. Fireflies with UI avoidance:', firefliesWithAvoidance.length + '/' + fs.fireflies.length);
    
    // Test 5: Performance check
    const startTime = performance.now();
    let frameCount = 0;
    
    function measureFrame() {
        frameCount++;
        if (frameCount < 60) {
            requestAnimationFrame(measureFrame);
        } else {
            const endTime = performance.now();
            const avgFrameTime = (endTime - startTime) / frameCount;
            const fps = 1000 / avgFrameTime;
            console.log('5. Performance (60 frames):');
            console.log('   Average frame time:', avgFrameTime.toFixed(2) + 'ms');
            console.log('   Estimated FPS:', fps.toFixed(1));
            console.log('   Performance rating:', fps > 55 ? '✓ Excellent' : fps > 45 ? '~ Good' : '✗ Needs optimization');
        }
    }
    
    measureFrame();
    
    // Test 6: Test configuration changes
    console.log('\n6. Testing configuration changes...');
    
    // Disable UI avoidance
    fs.setConfig({ uiAvoidanceEnabled: false });
    console.log('   UI avoidance disabled');
    
    setTimeout(() => {
        // Re-enable with different strength
        fs.setConfig({ 
            uiAvoidanceEnabled: true,
            uiAvoidanceStrength: 1.2,
            uiBoundaryPadding: 75
        });
        console.log('   UI avoidance re-enabled with new settings');
        console.log('   New strength:', fs.config.uiAvoidanceStrength);
        console.log('   New padding:', fs.config.uiBoundaryPadding);
    }, 2000);
}

// Instructions for use
console.log('UI Avoidance Test Ready!');
console.log('Run testUIAvoidance() to start the test');

// Auto-run after a short delay to ensure everything is loaded
setTimeout(() => {
    console.log('\nAuto-running test...\n');
    testUIAvoidance();
}, 1000);