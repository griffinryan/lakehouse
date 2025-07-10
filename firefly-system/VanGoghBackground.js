import * as THREE from 'three';
import { vanGoghLayerVertexShader, vanGoghLayerFragmentShader } from './shaders/vanGoghBackgroundShaders.js';

export class VanGoghBackground {
    constructor() {
        this.group = new THREE.Group();
        this.layers = [];
        this.time = 0;
        this.create();
    }
    
    create() {
        // Create multiple layers at different depths for parallax effect
        const layerConfigs = [
            {
                z: -1200,
                scale: 3000,
                layerIndex: 0,
                opacity: 1.0,
                swirls: 4,
                brushDensity: 8,
                colorShift: 0.0
            },
            {
                z: -900,
                scale: 2500,
                layerIndex: 1,
                opacity: 0.85,
                swirls: 3,
                brushDensity: 6,
                colorShift: 0.1
            },
            {
                z: -600,
                scale: 2000,
                layerIndex: 2,
                opacity: 0.7,
                swirls: 2,
                brushDensity: 4,
                colorShift: 0.2
            }
        ];
        
        layerConfigs.forEach((config, index) => {
            const geometry = new THREE.PlaneGeometry(config.scale, config.scale, 32, 32);
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                    layerIndex: { value: config.layerIndex },
                    opacity: { value: config.opacity },
                    swirls: { value: config.swirls },
                    brushDensity: { value: config.brushDensity },
                    colorShift: { value: config.colorShift },
                    fogColor: { value: new THREE.Color(0x0a0a2e) },
                    fogNear: { value: 1 },
                    fogFar: { value: 1000 }
                },
                vertexShader: vanGoghLayerVertexShader,
                fragmentShader: vanGoghLayerFragmentShader,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: true,
                blending: THREE.NormalBlending
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = config.z;
            mesh.renderOrder = -10000 + index; // Ensure background renders first
            
            this.layers.push({
                mesh: mesh,
                material: material,
                config: config,
                baseZ: config.z,
                swayAmount: 0.02 * (index + 1)
            });
            
            this.group.add(mesh);
        });
        
        // Add some slight rotation for dynamic perspective
        this.group.rotation.x = -0.05;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        this.layers.forEach((layer, index) => {
            // Update time uniform
            layer.material.uniforms.time.value = this.time * (1.0 - index * 0.1);
            
            // Gentle swaying motion for each layer
            const swayX = Math.sin(this.time * 0.2 + index) * layer.swayAmount;
            const swayY = Math.cos(this.time * 0.15 + index * 0.5) * layer.swayAmount * 0.5;
            
            layer.mesh.rotation.x = -0.05 + swayX;
            layer.mesh.rotation.y = swayY;
            
            // Subtle Z movement for depth variation
            const zOffset = Math.sin(this.time * 0.1 + index * Math.PI * 0.5) * 20;
            layer.mesh.position.z = layer.baseZ + zOffset;
        });
    }
    
    updateFog(fogColor, fogNear, fogFar) {
        this.layers.forEach(layer => {
            layer.material.uniforms.fogColor.value = fogColor;
            layer.material.uniforms.fogNear.value = fogNear;
            layer.material.uniforms.fogFar.value = fogFar;
        });
    }
    
    updateResolution() {
        const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.layers.forEach(layer => {
            layer.material.uniforms.resolution.value = resolution;
        });
    }
    
    setIntensity(intensity) {
        this.layers.forEach(layer => {
            layer.material.uniforms.opacity.value = layer.config.opacity * intensity;
        });
    }
    
    dispose() {
        this.layers.forEach(layer => {
            if (layer.mesh.geometry) layer.mesh.geometry.dispose();
            if (layer.material) layer.material.dispose();
            this.group.remove(layer.mesh);
        });
    }
}