import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Firefly } from './Firefly.js';
import { SwirlingBackground } from './SwirlingBackground.js';
import { Tree } from './Tree.js';
import { TextSwirl } from './TextSwirl.js';
import { MouseFollowText } from './MouseFollowText.js';
import { UIBoundaryManager } from './UIBoundaryManager.js';

export class FireflySystem {
    constructor(container = document.body) {
        this.container = container;
        this.fireflies = [];
        this.firefliesForeground = [];
        this.firefliesBackground = [];
        this.mouse = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.background = null;
        this.tree = null;
        this.backgroundScene = null;
        this.backgroundCamera = null;
        this.textSwirl = null;
        this.mouseFollowText = null;
        this.uiBoundaryManager = null;
        
        // Configuration
        this.config = {
            fireflyCount: 180,  // Optimized for performance on low-powered devices
            fireflyScale: 1,
            mouseRadius: 200,
            mouseForce: 0.5,
            environmentColor: new THREE.Color(0x0a0a2e),
            fogColor: new THREE.Color(0x0a0a2e),
            fogNear: 1,
            fogFar: 1000,
            bloomStrength: 4.0,  // Increased for more explosive visual impact
            bloomRadius: 1.2,    // Wider bloom spread
            bloomThreshold: 0.05,  // Lower threshold to capture more light
            uiAvoidanceStrength: 0.8,  // Strength of UI element avoidance
            uiAvoidanceEnabled: true,  // Toggle UI avoidance on/off
            uiBoundaryPadding: 50,  // Padding around UI elements in pixels
            mobileClusteringEnabled: true,  // Enable responsive clustering for mobile
            mobileClusterZones: [-300, -100, 100, 300],  // Vertical cluster positions for mobile
            mobileEdgeOffset: 200,  // Base distance from edge on mobile
            desktopEdgeOffset: 350  // Base distance from edge on desktop
        };
        
        this.init();
        this.createBackground();
        this.createTree();
        this.createFireflies();
        // this.createTextSwirl(); // Disabled to prevent conflicts with MouseFollowText
        this.createMouseFollowText();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(this.config.fogColor, this.config.fogNear, this.config.fogFar);
        
        // Background scene for swirling effect
        this.backgroundScene = new THREE.Scene();
        this.backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(-50, 50, 350);  // Adjusted to better frame the larger tree
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.8;  // Increased exposure for brighter fireflies
        this.renderer.autoClear = false;
        
        // Replace existing canvas if it exists
        const existingCanvas = document.getElementById('particles');
        if (existingCanvas) {
            existingCanvas.replaceWith(this.renderer.domElement);
            this.renderer.domElement.id = 'particles';
        } else {
            this.container.appendChild(this.renderer.domElement);
        }
        
        // Post-processing setup
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.config.bloomStrength,
            this.config.bloomRadius,
            this.config.bloomThreshold
        );
        this.composer.addPass(bloomPass);
        
        // Ambient light for subtle illumination
        const ambientLight = new THREE.AmbientLight(0x1a1a3e, 0.15);  // Slightly brighter ambient
        this.scene.add(ambientLight);
        
        // Add directional light for tree
        const directionalLight = new THREE.DirectionalLight(0x5a7fb5, 0.4);  // Stronger light for the tree
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
        
        // Add rim light for dramatic effect
        const rimLight = new THREE.DirectionalLight(0x8090a0, 0.2);
        rimLight.position.set(-100, 50, -50);
        this.scene.add(rimLight);
        
        // Initialize UI boundary manager
        this.uiBoundaryManager = new UIBoundaryManager(this.camera, this.renderer.domElement);
        this.uiBoundaryManager.setPadding(this.config.uiBoundaryPadding);
    }
    
    createBackground() {
        this.background = new SwirlingBackground();
        this.backgroundScene.add(this.background.mesh);
    }
    
    createTree() {
        this.tree = new Tree();
        this.scene.add(this.tree.group);
    }
    
    createFireflies() {
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        const treeSpawnPoints = this.tree.getSpawnPoints();
        const treeBounds = this.tree.getBoundingBox();
        
        // Calculate responsive parameters based on window aspect ratio
        const aspectRatio = window.innerWidth / window.innerHeight;
        const isMobile = aspectRatio < 0.7; // Portrait/vertical orientation
        const isTablet = aspectRatio >= 0.7 && aspectRatio < 1.2;
        
        // Adjust clustering parameters based on screen orientation
        const sideClusteringRatio = isMobile ? 0.5 : 0.4; // More side clustering on mobile
        const edgeOffsetBase = isMobile ? this.config.mobileEdgeOffset : this.config.desktopEdgeOffset;
        const edgeOffsetRange = isMobile ? 50 : 100; // Tighter clustering on mobile
        const verticalSpread = isMobile ? 800 : 600; // More vertical spread on mobile
        const horizontalSpread = isMobile ? 600 : 900; // Less horizontal spread on mobile
        
        for (let i = 0; i < this.config.fireflyCount; i++) {
            let position;
            
            // 30% spawn from tree branches
            if (i < this.config.fireflyCount * 0.3 && treeSpawnPoints.length > 0) {
                const spawnPoint = treeSpawnPoints[Math.floor(Math.random() * treeSpawnPoints.length)];
                position = spawnPoint.clone();
                position.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 80,  // Wider spread around tree
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 60
                ));
            } 
            // Side clustering - responsive to screen orientation
            else if (i < this.config.fireflyCount * (0.3 + sideClusteringRatio)) {
                const side = Math.random() < 0.5 ? -1 : 1;  // Left or right side
                
                // For mobile/vertical screens, create denser clusters at specific heights
                if (isMobile && this.config.mobileClusteringEnabled) {
                    // Create cluster zones vertically
                    const clusterZones = this.config.mobileClusterZones;
                    const zoneIndex = Math.floor(Math.random() * clusterZones.length);
                    const baseY = clusterZones[zoneIndex];
                    
                    position = new THREE.Vector3(
                        side * (edgeOffsetBase + Math.random() * edgeOffsetRange),
                        baseY + (Math.random() - 0.5) * 150, // Tight vertical clustering
                        (Math.random() - 0.5) * 300
                    );
                } else {
                    // Desktop/landscape distribution
                    const edgeOffset = edgeOffsetBase + Math.random() * edgeOffsetRange;
                    position = new THREE.Vector3(
                        side * edgeOffset,
                        (Math.random() - 0.5) * verticalSpread,
                        (Math.random() - 0.5) * 400
                    );
                }
            } else {
                // Rest spawn randomly in scene with responsive spread
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * horizontalSpread,
                    (Math.random() - 0.5) * verticalSpread,
                    (Math.random() - 0.5) * 500
                );
            }
            
            // Ensure firefly spawns outside UI boundaries
            if (this.config.uiAvoidanceEnabled && this.uiBoundaryManager) {
                position = this.uiBoundaryManager.findSafeSpawnPosition(position);
            }
            
            const firefly = new Firefly(geometry, {
                index: i,
                position: position,
                scale: Math.random() * 0.5 + 0.5,
                blinkOffset: Math.random() * Math.PI * 2,
                blinkSpeed: Math.random() * 0.5 + 0.5,
                floatSpeed: Math.random() * 0.3 + 0.2,
                floatRadius: Math.random() * 20 + 10,
                curiosity: Math.random() * 0.7 + 0.3,
                uiBoundaryManager: this.config.uiAvoidanceEnabled ? this.uiBoundaryManager : null,
                uiAvoidanceStrength: this.config.uiAvoidanceStrength
            });
            
            this.fireflies.push(firefly);
            
            // Separate fireflies into foreground and background layers
            if (position.z > treeBounds.min.z) {
                this.firefliesForeground.push(firefly);
                firefly.mesh.renderOrder = 1;
            } else {
                this.firefliesBackground.push(firefly);
                firefly.mesh.renderOrder = -1;
            }
            
            this.scene.add(firefly.mesh);
        }
    }
    
    createTextSwirl() {
        this.textSwirl = new TextSwirl(this.scene, this.camera);
        
        // Configure text swirl settings
        this.textSwirl.config = {
            ...this.textSwirl.config,
            particlesPerLetter: 15,
            swirlRadius: 80,
            swirlSpeed: 1.5,
            swirlDuration: 2.5,
            particleSize: 2.5,
            glowIntensity: 2.5
        };
    }
    
    createMouseFollowText() {
        this.mouseFollowText = new MouseFollowText(this.scene, this.camera);
        
        // Configure mouse follow settings with tighter orbital radius
        this.mouseFollowText.config = {
            ...this.mouseFollowText.config,
            influenceRadius: 100,      // Reduced for tighter orbit
            springStiffness: 0.08,     // Increased for tighter control
            damping: 0.85,             // Reduced for more responsive movement
            maxDisplacement: 50,       // Reduced max displacement
            returnForce: 0.06,         // Increased return force
            zDepth: 0.5,               // Reduced depth effect
            rotationEffect: 0.0005,    // Reduced rotation
            minDistance: 20,           // Tighter minimum distance
            stickiness: 0.3            // Added stickiness
        };
    }
    
    recreateFireflies() {
        // Remove existing fireflies
        this.fireflies.forEach(firefly => {
            this.scene.remove(firefly.mesh);
            firefly.destroy();
        });
        
        // Clear arrays
        this.fireflies = [];
        this.firefliesForeground = [];
        this.firefliesBackground = [];
        
        // Create new fireflies with updated distribution
        this.createFireflies();
    }
    
    updateFireflies(deltaTime) {
        this.fireflies.forEach(firefly => {
            firefly.update(deltaTime);
        });
    }
    
    updateBackground(deltaTime) {
        if (this.background) {
            this.background.update(deltaTime);
        }
    }
    
    updateTree(deltaTime) {
        if (this.tree) {
            this.tree.update(deltaTime);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock ? this.clock.getDelta() : 0;
        if (!this.clock) this.clock = new THREE.Clock();
        
        // Update all components
        this.updateBackground(deltaTime);
        this.updateTree(deltaTime);
        this.updateFireflies(deltaTime);
        
        // Update text swirl - disabled to prevent conflicts
        // if (this.textSwirl) {
        //     this.textSwirl.update(deltaTime);
        // }
        
        // Update mouse follow text
        if (this.mouseFollowText) {
            this.mouseFollowText.update(deltaTime);
        }
        
        // Render in layers
        this.renderer.clear();
        
        // Render background
        this.renderer.render(this.backgroundScene, this.backgroundCamera);
        
        // Render main scene with bloom
        this.composer.render();
    }
    
    setupEventListeners() {
        // Mouse movement
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Convert mouse position to 3D world coordinates
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            this.raycaster.ray.intersectPlane(intersectPlane, this.mouseWorld);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
            
            if (this.background) {
                this.background.updateResolution();
            }
            
            // Check if aspect ratio changed significantly (e.g., rotation on mobile)
            const newAspectRatio = window.innerWidth / window.innerHeight;
            const oldAspectRatio = this.lastAspectRatio || newAspectRatio;
            const aspectRatioChange = Math.abs(newAspectRatio - oldAspectRatio);
            
            // If aspect ratio changed significantly, recreate fireflies with new distribution
            if (aspectRatioChange > 0.5) {
                this.recreateFireflies();
            }
            
            this.lastAspectRatio = newAspectRatio;
        });
        
        // Touch events for mobile
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
                
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                this.raycaster.ray.intersectPlane(intersectPlane, this.mouseWorld);
            }
        });
        
        // Keyboard shortcuts
        window.addEventListener('keydown', async (event) => {
            // 'S' key for screenshot
            if (event.key === 's' || event.key === 'S') {
                console.log('Capturing screenshot...');
                
                // Show visual feedback
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '50%';
                overlay.style.left = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.background = 'rgba(0, 0, 0, 0.8)';
                overlay.style.color = 'white';
                overlay.style.padding = '20px 40px';
                overlay.style.borderRadius = '10px';
                overlay.style.fontSize = '20px';
                overlay.style.zIndex = '10000';
                overlay.textContent = 'Capturing high-resolution screenshot...';
                document.body.appendChild(overlay);
                
                try {
                    // Default to 4K resolution for manual captures
                    const success = await this.downloadScreenshot(3840, 2160);
                    
                    if (success) {
                        overlay.textContent = '✓ Screenshot saved!';
                        overlay.style.background = 'rgba(0, 128, 0, 0.8)';
                    } else {
                        overlay.textContent = '✗ Screenshot failed';
                        overlay.style.background = 'rgba(255, 0, 0, 0.8)';
                    }
                } catch (error) {
                    overlay.textContent = '✗ Screenshot failed';
                    overlay.style.background = 'rgba(255, 0, 0, 0.8)';
                    console.error('Screenshot error:', error);
                }
                
                // Remove overlay after 2 seconds
                setTimeout(() => {
                    overlay.remove();
                }, 2000);
            }
            
            // 'P' key for poster size (2400x3600)
            if (event.key === 'p' || event.key === 'P') {
                console.log('Capturing poster-sized screenshot...');
                
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '50%';
                overlay.style.left = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.background = 'rgba(0, 0, 0, 0.8)';
                overlay.style.color = 'white';
                overlay.style.padding = '20px 40px';
                overlay.style.borderRadius = '10px';
                overlay.style.fontSize = '20px';
                overlay.style.zIndex = '10000';
                overlay.textContent = 'Capturing poster-sized screenshot...';
                document.body.appendChild(overlay);
                
                try {
                    const success = await this.downloadScreenshot(2400, 3600);
                    
                    if (success) {
                        overlay.textContent = '✓ Poster saved!';
                        overlay.style.background = 'rgba(0, 128, 0, 0.8)';
                    } else {
                        overlay.textContent = '✗ Poster failed';
                        overlay.style.background = 'rgba(255, 0, 0, 0.8)';
                    }
                } catch (error) {
                    overlay.textContent = '✗ Poster failed';
                    overlay.style.background = 'rgba(255, 0, 0, 0.8)';
                    console.error('Poster error:', error);
                }
                
                setTimeout(() => {
                    overlay.remove();
                }, 2000);
            }
        });
    }
    
    // Configuration methods
    setConfig(newConfig) {
        Object.assign(this.config, newConfig);
        
        // Update scene settings
        if (newConfig.environmentColor) {
            this.scene.background = new THREE.Color(newConfig.environmentColor);
        }
        if (newConfig.fogColor || newConfig.fogNear || newConfig.fogFar) {
            this.scene.fog = new THREE.Fog(
                this.config.fogColor,
                this.config.fogNear,
                this.config.fogFar
            );
        }
        
        // Update UI boundary manager settings
        if (newConfig.uiBoundaryPadding && this.uiBoundaryManager) {
            this.uiBoundaryManager.setPadding(newConfig.uiBoundaryPadding);
        }
        
        // Update firefly UI avoidance settings
        if (newConfig.uiAvoidanceEnabled !== undefined || newConfig.uiAvoidanceStrength !== undefined) {
            this.fireflies.forEach(firefly => {
                firefly.uiBoundaryManager = this.config.uiAvoidanceEnabled ? this.uiBoundaryManager : null;
                firefly.uiAvoidanceStrength = this.config.uiAvoidanceStrength;
            });
        }
    }
    
    // High-quality screenshot capture method
    async captureScreenshot(width = 3840, height = 2160, filename = null) {
        // Store original renderer size
        const originalWidth = this.renderer.domElement.width;
        const originalHeight = this.renderer.domElement.height;
        const originalPixelRatio = this.renderer.getPixelRatio();
        
        // Create render target for high-resolution capture
        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: true,
            stencilBuffer: false,
            samples: 8 // Multi-sampling for better quality
        });
        
        // Temporarily update renderer settings
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(1); // Use 1:1 pixel ratio for exact resolution
        
        // Update camera aspect ratio
        const originalAspect = this.camera.aspect;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update composer for high-res render
        this.composer.setSize(width, height);
        
        // Render to render target
        this.renderer.setRenderTarget(renderTarget);
        
        // Clear and render background scene
        this.renderer.clear();
        this.renderer.render(this.backgroundScene, this.backgroundCamera);
        
        // Render main scene with bloom
        this.composer.render(renderTarget);
        
        // Read pixels from render target
        const pixels = new Uint8Array(width * height * 4);
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels);
        
        // Create canvas for image generation
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(width, height);
        
        // Flip Y-axis (WebGL renders upside down)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const sourceIndex = ((height - y - 1) * width + x) * 4;
                const targetIndex = (y * width + x) * 4;
                imageData.data[targetIndex] = pixels[sourceIndex];
                imageData.data[targetIndex + 1] = pixels[sourceIndex + 1];
                imageData.data[targetIndex + 2] = pixels[sourceIndex + 2];
                imageData.data[targetIndex + 3] = pixels[sourceIndex + 3];
            }
        }
        
        context.putImageData(imageData, 0, 0);
        
        // Restore original renderer settings
        this.renderer.setRenderTarget(null);
        this.renderer.setSize(originalWidth, originalHeight);
        this.renderer.setPixelRatio(originalPixelRatio);
        this.camera.aspect = originalAspect;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(originalWidth, originalHeight);
        
        // Clean up render target
        renderTarget.dispose();
        
        // Generate filename if not provided
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
            filename = `lakehouse-poster-${width}x${height}-${timestamp}.png`;
        }
        
        // Return canvas for further processing or download
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve({ blob, canvas, filename });
            }, 'image/png', 1.0);
        });
    }
    
    // Utility method to download screenshot
    async downloadScreenshot(width = 3840, height = 2160, filename = null) {
        try {
            const { blob, filename: finalFilename } = await this.captureScreenshot(width, height, filename);
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = finalFilename;
            link.click();
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            console.log(`Screenshot saved: ${finalFilename}`);
            return true;
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            return false;
        }
    }
    
    destroy() {
        // Clean up resources
        this.fireflies.forEach(firefly => firefly.destroy());
        if (this.background) this.background.dispose();
        if (this.tree) this.tree.dispose();
        if (this.textSwirl) this.textSwirl.destroy();
        if (this.mouseFollowText) this.mouseFollowText.destroy();
        if (this.uiBoundaryManager) this.uiBoundaryManager.destroy();
        this.renderer.dispose();
        this.composer.dispose();
    }
}