import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Firefly } from './Firefly.js';

export class FireflySystem {
    constructor(container = document.body) {
        this.container = container;
        this.fireflies = [];
        this.mouse = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        
        // Configuration
        this.config = {
            fireflyCount: 200,
            fireflyScale: 1,
            mouseRadius: 200,
            mouseForce: 0.5,
            environmentColor: new THREE.Color(0x0a0a2e),
            fogColor: new THREE.Color(0x0a0a2e),
            fogNear: 1,
            fogFar: 1000,
            bloomStrength: 2.5,
            bloomRadius: 0.8,
            bloomThreshold: 0.1
        };
        
        this.init();
        this.createFireflies();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(this.config.fogColor, this.config.fogNear, this.config.fogFar);
        this.scene.background = new THREE.Color(this.config.environmentColor);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 400;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        
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
        const ambientLight = new THREE.AmbientLight(0x0a0a2e, 0.1);
        this.scene.add(ambientLight);
    }
    
    createFireflies() {
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        
        for (let i = 0; i < this.config.fireflyCount; i++) {
            const firefly = new Firefly(geometry, {
                index: i,
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 800,
                    (Math.random() - 0.5) * 600,
                    (Math.random() - 0.5) * 400
                ),
                scale: Math.random() * 0.5 + 0.5,
                blinkOffset: Math.random() * Math.PI * 2,
                blinkSpeed: Math.random() * 0.5 + 0.5,
                floatSpeed: Math.random() * 0.3 + 0.2,
                floatRadius: Math.random() * 20 + 10,
                curiosity: Math.random() * 0.7 + 0.3
            });
            
            this.fireflies.push(firefly);
            this.scene.add(firefly.mesh);
        }
    }
    
    updateFireflies(deltaTime) {
        this.fireflies.forEach(firefly => {
            firefly.update(deltaTime, this.mouseWorld, this.config.mouseRadius, this.config.mouseForce);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock ? this.clock.getDelta() : 0;
        if (!this.clock) this.clock = new THREE.Clock();
        
        this.updateFireflies(deltaTime);
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
        this.renderer.dispose();
        this.composer.dispose();
    }
}