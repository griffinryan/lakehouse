import * as THREE from 'three';

export class UIBoundaryManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.boundaries = [];
        this.padding = 50; // Padding around UI elements in pixels
        this.updateBoundaries();
        
        // Update boundaries on window resize
        window.addEventListener('resize', () => this.updateBoundaries());
    }
    
    updateBoundaries() {
        this.boundaries = [];
        
        // Query all UI elements we want fireflies to avoid
        const selectors = [
            '.venue-name',
            '.band-name',
            '.date-display',
            '.tagline',
            '.event-info'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    // Convert pixel coordinates to normalized device coordinates
                    const boundary = {
                        left: rect.left - this.padding,
                        top: rect.top - this.padding,
                        right: rect.right + this.padding,
                        bottom: rect.bottom + this.padding,
                        centerX: (rect.left + rect.right) / 2,
                        centerY: (rect.top + rect.bottom) / 2,
                        width: rect.width + (this.padding * 2),
                        height: rect.height + (this.padding * 2)
                    };
                    
                    // Convert to Three.js world coordinates
                    const worldBoundary = this.screenToWorld(boundary);
                    this.boundaries.push(worldBoundary);
                }
            });
        });
    }
    
    screenToWorld(boundary) {
        // Convert screen coordinates to Three.js world coordinates
        const width = this.domElement.clientWidth;
        const height = this.domElement.clientHeight;
        
        // Convert to normalized device coordinates (-1 to 1)
        const ndcLeft = (boundary.left / width) * 2 - 1;
        const ndcRight = (boundary.right / width) * 2 - 1;
        const ndcTop = -(boundary.top / height) * 2 + 1;
        const ndcBottom = -(boundary.bottom / height) * 2 + 1;
        
        // Create vectors for corners
        const topLeft = new THREE.Vector3(ndcLeft, ndcTop, 0);
        const bottomRight = new THREE.Vector3(ndcRight, ndcBottom, 0);
        
        // Unproject to world coordinates
        topLeft.unproject(this.camera);
        bottomRight.unproject(this.camera);
        
        // Project onto z=0 plane (where fireflies move)
        const direction1 = topLeft.sub(this.camera.position).normalize();
        const direction2 = bottomRight.sub(this.camera.position).normalize();
        
        const distance1 = -this.camera.position.z / direction1.z;
        const distance2 = -this.camera.position.z / direction2.z;
        
        const worldTopLeft = this.camera.position.clone().add(direction1.multiplyScalar(distance1));
        const worldBottomRight = this.camera.position.clone().add(direction2.multiplyScalar(distance2));
        
        return {
            minX: Math.min(worldTopLeft.x, worldBottomRight.x),
            maxX: Math.max(worldTopLeft.x, worldBottomRight.x),
            minY: Math.min(worldTopLeft.y, worldBottomRight.y),
            maxY: Math.max(worldTopLeft.y, worldBottomRight.y),
            centerX: (worldTopLeft.x + worldBottomRight.x) / 2,
            centerY: (worldTopLeft.y + worldBottomRight.y) / 2,
            width: Math.abs(worldBottomRight.x - worldTopLeft.x),
            height: Math.abs(worldTopLeft.y - worldBottomRight.y)
        };
    }
    
    isInsideBoundary(position) {
        // Check if a position is inside any UI boundary
        for (const boundary of this.boundaries) {
            if (position.x >= boundary.minX && position.x <= boundary.maxX &&
                position.y >= boundary.minY && position.y <= boundary.maxY) {
                return true;
            }
        }
        return false;
    }
    
    getRepulsionForce(position, strength = 1.0) {
        const force = new THREE.Vector3(0, 0, 0);
        
        for (const boundary of this.boundaries) {
            // Calculate distance to boundary center
            const dx = position.x - boundary.centerX;
            const dy = position.y - boundary.centerY;
            
            // Check if we're within influence range
            const influenceX = boundary.width * 0.8;
            const influenceY = boundary.height * 0.8;
            
            if (Math.abs(dx) < influenceX && Math.abs(dy) < influenceY) {
                // Calculate normalized distance (0 at center, 1 at edge)
                const normalizedX = Math.abs(dx) / influenceX;
                const normalizedY = Math.abs(dy) / influenceY;
                const normalizedDistance = Math.max(normalizedX, normalizedY);
                
                // Calculate repulsion strength (stronger when closer)
                const repulsionStrength = (1 - normalizedDistance) * strength;
                
                // Calculate repulsion direction
                if (dx !== 0 || dy !== 0) {
                    const direction = new THREE.Vector2(dx, dy).normalize();
                    force.x += direction.x * repulsionStrength;
                    force.y += direction.y * repulsionStrength;
                }
            }
        }
        
        return force;
    }
    
    findSafeSpawnPosition(originalPosition, maxAttempts = 10) {
        // Try to find a spawn position outside UI boundaries
        let position = originalPosition.clone();
        
        if (!this.isInsideBoundary(position)) {
            return position;
        }
        
        // If inside boundary, try to find nearby safe position
        for (let i = 0; i < maxAttempts; i++) {
            const angle = (i / maxAttempts) * Math.PI * 2;
            const distance = 100 + i * 20; // Gradually increase search radius
            
            position.x = originalPosition.x + Math.cos(angle) * distance;
            position.y = originalPosition.y + Math.sin(angle) * distance;
            
            if (!this.isInsideBoundary(position)) {
                return position;
            }
        }
        
        // If no safe position found, push further away
        const force = this.getRepulsionForce(originalPosition, 150);
        position = originalPosition.clone().add(force);
        
        return position;
    }
    
    setPadding(padding) {
        this.padding = padding;
        this.updateBoundaries();
    }
    
    destroy() {
        window.removeEventListener('resize', () => this.updateBoundaries());
    }
}