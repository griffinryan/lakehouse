import * as THREE from 'three';

export class MouseFollowText {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.elements = new Map();
        this.mouse = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        
        // Physics configuration
        this.config = {
            influenceRadius: 250,      // Pixels - how far mouse affects elements
            springStiffness: 0.12,     // How quickly elements follow (increased for stickier feel)
            damping: 0.92,             // Smoothness of motion (0-1)
            maxDisplacement: 150,      // Maximum pixels elements can move
            returnForce: 0.08,         // Force pulling back to origin (increased)
            zDepth: 0.8,               // 3D depth effect multiplier
            rotationEffect: 0.0015,    // Rotation based on velocity
            minDistance: 30,           // Minimum distance for full stickiness
            stickiness: 0.25          // Extra force when very close to mouse
        };
        
        this.setupEventListeners();
    }
    
    addElement(element, options = {}) {
        const elementId = `follow_${Date.now()}_${Math.random()}`;
        const rect = element.getBoundingClientRect();
        
        // Store original position and create physics data
        const elementData = {
            element: element,
            originalX: rect.left + rect.width / 2,
            originalY: rect.top + rect.height / 2,
            currentX: rect.left + rect.width / 2,
            currentY: rect.top + rect.height / 2,
            velocityX: 0,
            velocityY: 0,
            rotation: 0,
            scale: 1,
            config: { ...this.config, ...options }
        };
        
        // Apply initial styles for smooth transitions
        element.style.position = 'relative';
        element.style.transition = 'none';
        element.style.willChange = 'transform';
        element.style.transformOrigin = 'center center';
        element.style.transform = 'translateZ(0)'; // Force GPU acceleration
        
        // If element has individual letters, set them up too
        const letters = element.querySelectorAll('.letter');
        if (letters.length > 0) {
            elementData.letters = [];
            letters.forEach((letter, index) => {
                const letterRect = letter.getBoundingClientRect();
                letter.style.position = 'relative';
                letter.style.display = 'inline-block';
                letter.style.transition = 'none';
                letter.style.willChange = 'transform';
                
                elementData.letters.push({
                    element: letter,
                    originalX: letterRect.left + letterRect.width / 2,
                    originalY: letterRect.top + letterRect.height / 2,
                    currentX: letterRect.left + letterRect.width / 2,
                    currentY: letterRect.top + letterRect.height / 2,
                    velocityX: 0,
                    velocityY: 0,
                    rotation: 0,
                    delay: index * 0.02, // Stagger effect
                    amplitude: 1 + (index % 3) * 0.2 // Varying response
                });
            });
        }
        
        this.elements.set(elementId, elementData);
        return elementId;
    }
    
    removeElement(elementId) {
        const elementData = this.elements.get(elementId);
        if (elementData) {
            // Reset styles
            elementData.element.style.transform = '';
            elementData.element.style.position = '';
            elementData.element.style.transition = '';
            elementData.element.style.willChange = '';
            
            if (elementData.letters) {
                elementData.letters.forEach(letter => {
                    letter.element.style.transform = '';
                    letter.element.style.position = '';
                    letter.element.style.transition = '';
                    letter.element.style.willChange = '';
                });
            }
            
            this.elements.delete(elementId);
        }
    }
    
    setupEventListeners() {
        // Track mouse movement
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            
            // Convert to Three.js coordinates for 3D effects
            const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
            const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera({ x: normalizedX, y: normalizedY }, this.camera);
            
            const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            this.raycaster.ray.intersectPlane(intersectPlane, this.mouseWorld);
        });
        
        // Handle touch events for mobile
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                this.mouse.x = touch.clientX;
                this.mouse.y = touch.clientY;
            }
        });
    }
    
    update(deltaTime) {
        this.elements.forEach((elementData) => {
            // Update main element
            this.updateElement(elementData, deltaTime);
            
            // Update individual letters if they exist
            if (elementData.letters) {
                elementData.letters.forEach((letter) => {
                    this.updateLetter(letter, elementData.config, deltaTime);
                });
            }
        });
    }
    
    updateElement(elementData, deltaTime) {
        const config = elementData.config;
        
        // Get current element position without transform
        const currentTransform = this.parseTransform(elementData.element);
        const rect = elementData.element.getBoundingClientRect();
        
        // Calculate center position accounting for current transform
        const centerX = rect.left + rect.width / 2 - currentTransform.x;
        const centerY = rect.top + rect.height / 2 - currentTransform.y;
        
        // Update original position on first frame or if not set
        if (!elementData.initialized) {
            elementData.originalX = centerX;
            elementData.originalY = centerY;
            elementData.currentX = centerX;
            elementData.currentY = centerY;
            elementData.initialized = true;
        }
        
        // Calculate distance to mouse
        const dx = this.mouse.x - elementData.currentX;
        const dy = this.mouse.y - elementData.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate influence based on distance
        const influence = Math.max(0, 1 - distance / config.influenceRadius);
        
        if (influence > 0) {
            // Apply attraction force towards mouse with extra stickiness when close
            let effectiveStiffness = config.springStiffness;
            
            // Add extra force when very close (sticky behavior)
            if (distance < config.minDistance) {
                effectiveStiffness += config.stickiness * (1 - distance / config.minDistance);
            }
            
            const forceX = dx * influence * effectiveStiffness;
            const forceY = dy * influence * effectiveStiffness;
            
            elementData.velocityX += forceX;
            elementData.velocityY += forceY;
        }
        
        // Apply return force to original position with easing
        const returnDx = elementData.originalX - elementData.currentX;
        const returnDy = elementData.originalY - elementData.currentY;
        const returnDistance = Math.sqrt(returnDx * returnDx + returnDy * returnDy);
        
        // Stronger return force when further from origin
        const dynamicReturnForce = config.returnForce * (1 + returnDistance / config.maxDisplacement);
        
        elementData.velocityX += returnDx * dynamicReturnForce;
        elementData.velocityY += returnDy * dynamicReturnForce;
        
        // Apply damping
        elementData.velocityX *= config.damping;
        elementData.velocityY *= config.damping;
        
        // Update position
        elementData.currentX += elementData.velocityX;
        elementData.currentY += elementData.velocityY;
        
        // Calculate displacement from original position
        const displacementX = elementData.currentX - elementData.originalX;
        const displacementY = elementData.currentY - elementData.originalY;
        
        // Limit maximum displacement
        const currentDisplacement = Math.sqrt(displacementX * displacementX + displacementY * displacementY);
        if (currentDisplacement > config.maxDisplacement) {
            const scale = config.maxDisplacement / currentDisplacement;
            elementData.currentX = elementData.originalX + displacementX * scale;
            elementData.currentY = elementData.originalY + displacementY * scale;
        }
        
        // Calculate rotation based on velocity
        elementData.rotation = elementData.velocityX * config.rotationEffect;
        
        // Apply transform
        const finalDisplacementX = elementData.currentX - elementData.originalX;
        const finalDisplacementY = elementData.currentY - elementData.originalY;
        const zOffset = influence * 20 * config.zDepth; // 3D depth effect
        
        elementData.element.style.transform = 
            `translate3d(${finalDisplacementX}px, ${finalDisplacementY}px, ${zOffset}px) ` +
            `rotate(${elementData.rotation}rad) ` +
            `scale(${1 + influence * 0.08})`;
    }
    
    updateLetter(letter, config, deltaTime) {
        // Similar physics but with individual letter behavior
        const dx = this.mouse.x - letter.currentX;
        const dy = this.mouse.y - letter.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate influence with letter-specific delay
        const influence = Math.max(0, 1 - distance / config.influenceRadius) * letter.amplitude;
        
        if (influence > 0) {
            const forceX = dx * influence * config.springStiffness * 1.2;
            const forceY = dy * influence * config.springStiffness * 1.2;
            
            letter.velocityX += forceX;
            letter.velocityY += forceY;
        }
        
        // Return force with slight variation per letter
        const returnDx = letter.originalX - letter.currentX;
        const returnDy = letter.originalY - letter.currentY;
        letter.velocityX += returnDx * config.returnForce * (1 + letter.delay);
        letter.velocityY += returnDy * config.returnForce * (1 + letter.delay);
        
        // Damping
        letter.velocityX *= config.damping;
        letter.velocityY *= config.damping;
        
        // Update position
        letter.currentX += letter.velocityX;
        letter.currentY += letter.velocityY;
        
        // Apply transform to letter
        const displacementX = letter.currentX - letter.originalX;
        const displacementY = letter.currentY - letter.originalY;
        const rotation = letter.velocityX * config.rotationEffect * 2;
        const scale = 1 + influence * 0.1 * Math.sin(Date.now() * 0.001 + letter.delay * 10);
        
        letter.element.style.transform = 
            `translate3d(${displacementX}px, ${displacementY}px, 0px) ` +
            `rotate(${rotation}rad) ` +
            `scale(${scale})`;
    }
    
    parseTransform(element) {
        const transform = window.getComputedStyle(element).transform;
        if (transform === 'none') return { x: 0, y: 0 };
        
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(', ');
            return {
                x: parseFloat(values[4]) || 0,
                y: parseFloat(values[5]) || 0
            };
        }
        return { x: 0, y: 0 };
    }
    
    setConfig(newConfig) {
        Object.assign(this.config, newConfig);
        
        // Update all element configs
        this.elements.forEach(elementData => {
            elementData.config = { ...this.config, ...elementData.config };
        });
    }
    
    destroy() {
        // Reset all elements
        this.elements.forEach((elementData, elementId) => {
            this.removeElement(elementId);
        });
        this.elements.clear();
    }
}