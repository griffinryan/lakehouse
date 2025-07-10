import * as THREE from 'three';

export class Tree {
    constructor() {
        this.group = new THREE.Group();
        this.branches = [];
        this.spawnPoints = [];
        this.time = 0;
        this.swayAmount = 0.02;
        this.create();
    }
    
    create() {
        // Tree parameters
        const trunkHeight = 80;
        const trunkRadius = 8;
        const branchingFactor = 0.7;
        const branchAngleVariation = Math.PI / 6;
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(
            trunkRadius * 0.8, 
            trunkRadius, 
            trunkHeight, 
            8
        );
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a3426,
            emissive: 0x2a1a10,
            emissiveIntensity: 0.2,
            shininess: 10
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        this.group.add(trunk);
        
        // Generate branches recursively
        this.generateBranches(
            new THREE.Vector3(0, trunkHeight, 0),
            new THREE.Vector3(0, 1, 0),
            trunkRadius * 0.7,
            trunkHeight * 0.4,
            3,
            branchingFactor,
            branchAngleVariation
        );
        
        // Position tree at bottom of scene
        this.group.position.set(0, -200, -50);
    }
    
    generateBranches(position, direction, radius, length, depth, branchingFactor, angleVariation) {
        if (depth <= 0 || radius < 1) return;
        
        // Create branch geometry
        const branchGeometry = new THREE.CylinderGeometry(
            radius * 0.6,
            radius,
            length,
            6
        );
        
        const branchMaterial = new THREE.MeshPhongMaterial({
            color: depth > 1 ? 0x4a3426 : 0x3a2416,
            emissive: 0x2a1a10,
            emissiveIntensity: 0.1
        });
        
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        
        // Position and orient branch
        const endPosition = position.clone().add(direction.clone().multiplyScalar(length));
        const midPosition = position.clone().add(direction.clone().multiplyScalar(length / 2));
        
        branch.position.copy(midPosition);
        branch.lookAt(endPosition);
        branch.rotateX(Math.PI / 2);
        
        this.group.add(branch);
        this.branches.push({
            mesh: branch,
            depth: depth,
            originalRotation: branch.rotation.clone()
        });
        
        // Add spawn points along the branch
        const numSpawnPoints = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numSpawnPoints; i++) {
            const t = (i + 1) / (numSpawnPoints + 1);
            const spawnPoint = position.clone().lerp(endPosition, t);
            this.spawnPoints.push(spawnPoint);
        }
        
        // Generate child branches
        const numChildren = depth > 1 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 4) + 3;
        
        for (let i = 0; i < numChildren; i++) {
            // Calculate new direction with variation
            const angleX = (Math.random() - 0.5) * angleVariation * 2;
            const angleZ = (Math.random() - 0.5) * angleVariation * 2;
            
            const newDirection = direction.clone();
            newDirection.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleX);
            newDirection.applyAxisAngle(new THREE.Vector3(0, 0, 1), angleZ);
            newDirection.normalize();
            
            // Recursively generate child branch
            this.generateBranches(
                endPosition,
                newDirection,
                radius * branchingFactor,
                length * (0.6 + Math.random() * 0.3),
                depth - 1,
                branchingFactor,
                angleVariation * 1.2
            );
        }
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Apply swaying motion to branches
        this.branches.forEach((branch, index) => {
            const { mesh, depth, originalRotation } = branch;
            
            // More sway for smaller branches
            const swayIntensity = this.swayAmount * (4 - depth) * 0.3;
            
            // Create natural swaying motion
            const swayX = Math.sin(this.time * 0.5 + index * 0.1) * swayIntensity;
            const swayZ = Math.cos(this.time * 0.7 + index * 0.15) * swayIntensity * 0.7;
            
            // Apply sway to original rotation
            mesh.rotation.x = originalRotation.x + swayX;
            mesh.rotation.z = originalRotation.z + swayZ;
        });
        
        // Gentle sway for the entire tree
        this.group.rotation.z = Math.sin(this.time * 0.3) * 0.01;
    }
    
    getSpawnPoints() {
        // Transform spawn points to world coordinates
        const worldSpawnPoints = this.spawnPoints.map(point => {
            const worldPoint = point.clone();
            this.group.localToWorld(worldPoint);
            return worldPoint;
        });
        
        return worldSpawnPoints;
    }
    
    getBoundingBox() {
        const box = new THREE.Box3();
        box.setFromObject(this.group);
        return box;
    }
    
    dispose() {
        this.branches.forEach(({ mesh }) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
    }
}