import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Firefly } from './Firefly.js';
import { SwirlingBackground } from './SwirlingBackground.js';
import { Tree } from './Tree.js';
import { TextSwirl } from './TextSwirl.js';
import { MouseFollowText } from './MouseFollowText.js';

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
        
        // Configuration
        this.config = {
            fireflyCount: 250,  // More fireflies for denser effect
            fireflyScale: 1,
            mouseRadius: 200,
            mouseForce: 0.5,
            environmentColor: new THREE.Color(0x0a0a2e),
            fogColor: new THREE.Color(0x0a0a2e),
            fogNear: 1,
            fogFar: 1000,
            bloomStrength: 4.0,  // Increased for more explosive visual impact
            bloomRadius: 1.2,    // Wider bloom spread
            bloomThreshold: 0.05  // Lower threshold to capture more light
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
        
        for (let i = 0; i < this.config.fireflyCount; i++) {
            let position;
            
            // 40% spawn from tree branches
            if (i < this.config.fireflyCount * 0.4 && treeSpawnPoints.length > 0) {
                const spawnPoint = treeSpawnPoints[Math.floor(Math.random() * treeSpawnPoints.length)];
                position = spawnPoint.clone();
                position.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 80,  // Wider spread around tree
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 60
                ));
            } else {
                // Rest spawn randomly in scene
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * 900,  // Wider scene distribution
                    (Math.random() - 0.5) * 700,
                    (Math.random() - 0.5) * 500
                );
            }
            
            const firefly = new Firefly(geometry, {
                index: i,
                position: position,
                scale: Math.random() * 0.5 + 0.5,
                blinkOffset: Math.random() * Math.PI * 2,
                blinkSpeed: Math.random() * 0.5 + 0.5,
                floatSpeed: Math.random() * 0.3 + 0.2,
                floatRadius: Math.random() * 20 + 10,
                curiosity: Math.random() * 0.7 + 0.3
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
        
        // Configure mouse follow settings
        this.mouseFollowText.config = {
            ...this.mouseFollowText.config,
            influenceRadius: 150,
            springStiffness: 0.04,
            damping: 0.88,
            maxDisplacement: 80,
            returnForce: 0.02,
            zDepth: 0.8,
            rotationEffect: 0.0008
        };
    }
    
    updateFireflies(deltaTime) {
        this.fireflies.forEach(firefly => {
            firefly.update(deltaTime, this.mouseWorld, this.config.mouseRadius, this.config.mouseForce);
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
    }
    
    destroy() {
        // Clean up resources
        this.fireflies.forEach(firefly => firefly.destroy());
        if (this.background) this.background.dispose();
        if (this.tree) this.tree.dispose();
        if (this.textSwirl) this.textSwirl.destroy();
        if (this.mouseFollowText) this.mouseFollowText.destroy();
        this.renderer.dispose();
        this.composer.dispose();
    }
}