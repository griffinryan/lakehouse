import * as THREE from 'three';
import { swirlVertexShader, swirlFragmentShader } from './shaders/swirlShaders.js';

export class TextSwirl {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.particles = [];
        this.activeSwirls = new Map();
        this.clock = new THREE.Clock();
        
        // Configuration
        this.config = {
            particlesPerLetter: 20,
            swirlRadius: 100,
            swirlSpeed: 2.0,
            swirlDuration: 3.0,
            particleSize: 3.0,
            fadeInTime: 0.3,
            fadeOutTime: 0.5,
            spiralTightness: 0.1,
            spiralExpansion: 1.5,
            glowIntensity: 2.0
        };
        
        // Materials cache
        this.materials = new Map();
        
        // Geometry for all particles
        this.geometry = new THREE.BufferGeometry();
        this.setupGeometry();
    }
    
    setupGeometry() {
        // Pre-allocate for maximum possible particles
        const maxParticles = 1000;
        const positions = new Float32Array(maxParticles * 3);
        const colors = new Float32Array(maxParticles * 3);
        const sizes = new Float32Array(maxParticles);
        const alphas = new Float32Array(maxParticles);
        const times = new Float32Array(maxParticles);
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        this.geometry.setAttribute('time', new THREE.BufferAttribute(times, 1));
        
        // Create material
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: window.devicePixelRatio },
                uGlowIntensity: { value: this.config.glowIntensity }
            },
            vertexShader: swirlVertexShader,
            fragmentShader: swirlFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create points mesh
        this.points = new THREE.Points(this.geometry, this.material);
        this.points.frustumCulled = false;
        this.scene.add(this.points);
    }
    
    createSwirlFromElement(element, options = {}) {
        const swirlId = `swirl_${Date.now()}_${Math.random()}`;
        const config = { ...this.config, ...options };
        
        // Get element text and position
        const text = element.textContent;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Convert screen coordinates to Three.js world coordinates
        const worldPos = this.screenToWorld(centerX, centerY);
        
        // Get color from element
        const computedStyle = window.getComputedStyle(element);
        const color = new THREE.Color(computedStyle.color);
        
        // Create particles for each letter
        const letters = element.querySelectorAll('.letter') || [element];
        const particleData = [];
        
        letters.forEach((letter, letterIndex) => {
            const letterRect = letter.getBoundingClientRect();
            const letterX = letterRect.left + letterRect.width / 2;
            const letterY = letterRect.top + letterRect.height / 2;
            const letterWorldPos = this.screenToWorld(letterX, letterY);
            
            // Get letter color if it has specific class
            let letterColor = color.clone();
            if (letter.classList.contains('coral')) {
                letterColor = new THREE.Color(0xff6b6b);
            } else if (letter.classList.contains('yellow')) {
                letterColor = new THREE.Color(0xfbbf24);
            }
            
            // Create particles for this letter
            for (let i = 0; i < config.particlesPerLetter; i++) {
                const particle = {
                    id: `${swirlId}_${letterIndex}_${i}`,
                    originalPos: letterWorldPos.clone(),
                    currentPos: letterWorldPos.clone(),
                    velocity: new THREE.Vector3(),
                    color: letterColor,
                    size: config.particleSize * (0.5 + Math.random() * 0.5),
                    alpha: 0,
                    targetAlpha: 1,
                    phase: Math.random() * Math.PI * 2,
                    radius: config.swirlRadius * (0.8 + Math.random() * 0.4),
                    speed: config.swirlSpeed * (0.8 + Math.random() * 0.4),
                    spiralOffset: Math.random() * Math.PI * 2,
                    lifeTime: 0,
                    maxLifeTime: config.swirlDuration,
                    letterIndex: letterIndex,
                    totalLetters: letters.length
                };
                
                particleData.push(particle);
                this.particles.push(particle);
            }
        });
        
        // Store swirl data
        this.activeSwirls.set(swirlId, {
            particles: particleData,
            element: element,
            startTime: this.clock.getElapsedTime(),
            config: config,
            phase: 'swirling', // 'swirling' or 'returning'
            worldCenter: worldPos
        });
        
        // Hide original element during animation
        element.style.opacity = '0';
        element.style.transition = `opacity ${config.fadeInTime}s ease-out`;
        
        return swirlId;
    }
    
    screenToWorld(x, y) {
        const vector = new THREE.Vector3();
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Convert to normalized device coordinates
        vector.x = (x / width) * 2 - 1;
        vector.y = -(y / height) * 2 + 1;
        vector.z = 0;
        
        // Unproject from screen space to world space
        vector.unproject(this.camera);
        
        // Project onto a plane at z=0 (or wherever your text should be)
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        return pos;
    }
    
    updateSwirl(swirlId, deltaTime) {
        const swirl = this.activeSwirls.get(swirlId);
        if (!swirl) return;
        
        const elapsed = this.clock.getElapsedTime() - swirl.startTime;
        const progress = elapsed / swirl.config.swirlDuration;
        
        swirl.particles.forEach((particle, index) => {
            particle.lifeTime += deltaTime;
            
            if (swirl.phase === 'swirling') {
                // Spiral motion
                const t = particle.lifeTime * particle.speed;
                const spiralRadius = particle.radius * (1 + swirl.config.spiralExpansion * progress);
                const angle = particle.spiralOffset + t;
                
                // Archimedean spiral with vertical component
                const x = spiralRadius * Math.cos(angle) * progress;
                const y = spiralRadius * Math.sin(angle) * progress;
                const z = progress * 50 * Math.sin(t * 2); // Vertical oscillation
                
                // Update position relative to swirl center
                particle.currentPos.x = swirl.worldCenter.x + x;
                particle.currentPos.y = swirl.worldCenter.y + y;
                particle.currentPos.z = swirl.worldCenter.z + z;
                
                // Fade in/out
                if (progress < 0.1) {
                    particle.alpha = progress * 10;
                } else if (progress > 0.8) {
                    particle.alpha = (1 - progress) * 5;
                } else {
                    particle.alpha = 1;
                }
                
                // Add some turbulence
                particle.currentPos.x += Math.sin(t * 3 + particle.phase) * 5;
                particle.currentPos.y += Math.cos(t * 2 + particle.phase) * 5;
                
            } else if (swirl.phase === 'returning') {
                // Return to original position
                const returnProgress = (elapsed - swirl.config.swirlDuration) / swirl.config.fadeOutTime;
                
                if (returnProgress >= 1) {
                    particle.currentPos.copy(particle.originalPos);
                    particle.alpha = 0;
                } else {
                    // Smooth return using easing
                    const eased = this.easeInOutCubic(returnProgress);
                    particle.currentPos.lerpVectors(
                        particle.currentPos,
                        particle.originalPos,
                        eased * 0.1
                    );
                    particle.alpha = 1 - returnProgress;
                }
            }
        });
        
        // Check if animation is complete
        if (swirl.phase === 'swirling' && progress >= 1) {
            swirl.phase = 'returning';
            swirl.startTime = this.clock.getElapsedTime();
        } else if (swirl.phase === 'returning' && elapsed >= swirl.config.fadeOutTime) {
            this.completeSwirl(swirlId);
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    completeSwirl(swirlId) {
        const swirl = this.activeSwirls.get(swirlId);
        if (!swirl) return;
        
        // Show original element again
        swirl.element.style.opacity = '1';
        
        // Remove particles from main array
        swirl.particles.forEach(particle => {
            const index = this.particles.indexOf(particle);
            if (index > -1) {
                this.particles.splice(index, 1);
            }
        });
        
        // Remove from active swirls
        this.activeSwirls.delete(swirlId);
    }
    
    update(deltaTime) {
        // Update time uniform
        this.material.uniforms.uTime.value = this.clock.getElapsedTime();
        
        // Update all active swirls
        this.activeSwirls.forEach((swirl, swirlId) => {
            this.updateSwirl(swirlId, deltaTime);
        });
        
        // Update geometry attributes
        this.updateGeometry();
    }
    
    updateGeometry() {
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        const sizes = this.geometry.attributes.size.array;
        const alphas = this.geometry.attributes.alpha.array;
        const times = this.geometry.attributes.time.array;
        
        // Update attributes for all particles
        this.particles.forEach((particle, i) => {
            const i3 = i * 3;
            
            positions[i3] = particle.currentPos.x;
            positions[i3 + 1] = particle.currentPos.y;
            positions[i3 + 2] = particle.currentPos.z;
            
            colors[i3] = particle.color.r;
            colors[i3 + 1] = particle.color.g;
            colors[i3 + 2] = particle.color.b;
            
            sizes[i] = particle.size;
            alphas[i] = particle.alpha;
            times[i] = particle.lifeTime;
        });
        
        // Clear unused particles
        for (let i = this.particles.length; i < positions.length / 3; i++) {
            alphas[i] = 0;
        }
        
        // Mark attributes as needing update
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.alpha.needsUpdate = true;
        this.geometry.attributes.time.needsUpdate = true;
        
        // Update draw range
        this.geometry.setDrawRange(0, this.particles.length);
    }
    
    triggerRandomSwirl() {
        // Get all elements with swirl capability
        const swirlableElements = [
            ...document.querySelectorAll('.band-name'),
            document.querySelector('.venue-name'),
            document.querySelector('.date-display')
        ].filter(el => el && !this.isElementSwirling(el));
        
        if (swirlableElements.length > 0) {
            const randomElement = swirlableElements[Math.floor(Math.random() * swirlableElements.length)];
            this.createSwirlFromElement(randomElement);
        }
    }
    
    isElementSwirling(element) {
        for (const [_, swirl] of this.activeSwirls) {
            if (swirl.element === element) {
                return true;
            }
        }
        return false;
    }
    
    destroy() {
        // Clean up Three.js resources
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.points);
        
        // Clear all active swirls
        this.activeSwirls.forEach((swirl, swirlId) => {
            swirl.element.style.opacity = '1';
        });
        this.activeSwirls.clear();
        this.particles = [];
    }
}