import * as THREE from 'three';
import { fireflyVertexShader, fireflyFragmentShader } from './shaders/fireflyShaders.js';

export class Firefly {
    constructor(geometry, options = {}) {
        this.options = {
            index: 0,
            position: new THREE.Vector3(0, 0, 0),
            scale: 1,
            blinkOffset: 0,
            blinkSpeed: 1,
            floatSpeed: 0.5,
            floatRadius: 15,
            curiosity: 0.5,
            color: new THREE.Color().setHSL(0.11 + Math.random() * 0.05, 0.8, 0.5), // Warm yellows to greens
            ...options
        };
        
        // State
        this.originalPosition = this.options.position.clone();
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        this.time = Math.random() * Math.PI * 2;
        this.blinkIntensity = 1;
        this.isBlinking = true;
        this.targetIntensity = 1;
        this.burstMode = false;
        this.burstTimer = 0;
        
        // Create material with custom shaders
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: this.options.color },
                intensity: { value: 1 },
                glowStrength: { value: 5.0 },  // Increased for more explosive glow
                coreSize: { value: 0.3 }
            },
            vertexShader: fireflyVertexShader,
            fragmentShader: fireflyFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(this.options.position);
        this.mesh.scale.setScalar(this.options.scale * 2.5);  // Larger fireflies for more impact
        
        // Add subtle random rotation
        this.mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
    }
    
    update(deltaTime, mousePosition, mouseRadius, mouseForce) {
        this.time += deltaTime;
        
        // Update shader time
        this.material.uniforms.time.value = this.time;
        
        // Floating behavior
        this.updateFloatingBehavior(deltaTime);
        
        // Blinking behavior
        this.updateBlinkingBehavior(deltaTime);
        
        // Mouse interaction
        this.updateMouseInteraction(mousePosition, mouseRadius, mouseForce, deltaTime);
        
        // Apply velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
        
        // Boundary wrapping
        this.wrapBoundaries();
        
        // Update material intensity
        this.material.uniforms.intensity.value = this.blinkIntensity;
    }
    
    updateFloatingBehavior(deltaTime) {
        // Lazy floating using sine waves
        const floatX = Math.sin(this.time * this.options.floatSpeed) * this.options.floatRadius;
        const floatY = Math.sin(this.time * this.options.floatSpeed * 1.3) * this.options.floatRadius * 0.7;
        const floatZ = Math.sin(this.time * this.options.floatSpeed * 0.7) * this.options.floatRadius * 0.5;
        
        // Add to velocity for organic movement
        this.velocity.x += (floatX - this.velocity.x) * deltaTime * 0.5;
        this.velocity.y += (floatY - this.velocity.y) * deltaTime * 0.5;
        this.velocity.z += (floatZ - this.velocity.z) * deltaTime * 0.5;
        
        // Add small random perturbations
        if (Math.random() < 0.01) {
            this.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
        }
        
        // Damping
        this.velocity.multiplyScalar(0.98);
    }
    
    updateBlinkingBehavior(deltaTime) {
        // Realistic firefly blinking pattern
        const blinkPhase = this.time * this.options.blinkSpeed + this.options.blinkOffset;
        
        // Create complex blinking pattern
        if (this.isBlinking) {
            // Use sine wave for smooth transitions
            const baseIntensity = Math.sin(blinkPhase) * 0.5 + 0.5;
            
            // Add explosive burst effects
            if (!this.burstMode && Math.random() < 0.004) {
                this.burstMode = true;
                this.burstTimer = 0;
                this.targetIntensity = 2.0;  // Explosive brightness
            } else if (this.burstMode) {
                this.burstTimer += deltaTime;
                if (this.burstTimer < 0.2) {
                    // Rapid strobe during burst
                    this.targetIntensity = 2.0 + Math.sin(this.burstTimer * 50) * 0.5;
                } else if (this.burstTimer < 0.5) {
                    // Fade out
                    this.targetIntensity = 2.0 * (1.0 - (this.burstTimer - 0.2) / 0.3);
                } else {
                    this.burstMode = false;
                    this.targetIntensity = baseIntensity;
                }
            } else if (Math.random() < 0.008) {
                this.targetIntensity = 0.1;  // Occasional dim
            } else {
                this.targetIntensity = baseIntensity * (0.8 + Math.random() * 0.4);
            }
            
            // Smooth transition to target intensity with variable speed
            const transitionSpeed = this.burstMode ? 15 : 5;
            this.blinkIntensity += (this.targetIntensity - this.blinkIntensity) * deltaTime * transitionSpeed;
        }
        
        // Clamp intensity with higher maximum for explosiveness
        this.blinkIntensity = Math.max(0.1, Math.min(2.5, this.blinkIntensity));
    }
    
    updateMouseInteraction(mousePosition, mouseRadius, mouseForce, deltaTime) {
        if (!mousePosition || mousePosition.length() === 0) return;
        
        const distance = this.mesh.position.distanceTo(mousePosition);
        
        if (distance < mouseRadius) {
            const force = 1 - (distance / mouseRadius);
            const direction = new THREE.Vector3().subVectors(this.mesh.position, mousePosition).normalize();
            
            // Swirling motion around mouse
            const tangent = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
            const swirlForce = force * mouseForce * this.options.curiosity;
            
            // Combine repulsion and swirl
            const repulsionForce = direction.multiplyScalar(force * mouseForce * 0.5);
            const swirlVector = tangent.multiplyScalar(swirlForce);
            
            this.velocity.add(repulsionForce);
            this.velocity.add(swirlVector);
            
            // Dramatically increase brightness when near mouse
            this.blinkIntensity = Math.min(this.blinkIntensity + force * 1.0, 2.5);
            
            // Trigger burst mode occasionally when interacting
            if (!this.burstMode && Math.random() < force * 0.02) {
                this.burstMode = true;
                this.burstTimer = 0;
            }
        }
    }
    
    wrapBoundaries() {
        const bounds = 500;
        
        if (this.mesh.position.x > bounds) this.mesh.position.x = -bounds;
        if (this.mesh.position.x < -bounds) this.mesh.position.x = bounds;
        if (this.mesh.position.y > bounds) this.mesh.position.y = -bounds;
        if (this.mesh.position.y < -bounds) this.mesh.position.y = bounds;
        if (this.mesh.position.z > bounds / 2) this.mesh.position.z = -bounds / 2;
        if (this.mesh.position.z < -bounds / 2) this.mesh.position.z = bounds / 2;
    }
    
    destroy() {
        this.material.dispose();
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}