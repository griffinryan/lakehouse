export const fireflyVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Make point size responsive to distance
        gl_PointSize = 10.0 * (300.0 / -mvPosition.z);
    }
`;

export const fireflyFragmentShader = `
    uniform vec3 color;
    uniform float intensity;
    uniform float time;
    uniform float glowStrength;
    uniform float coreSize;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        // Calculate distance from center for radial gradient
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        
        // Create bright core with soft falloff
        float coreGlow = 1.0 - smoothstep(0.0, coreSize, dist);
        float outerGlow = 1.0 - smoothstep(coreSize, 1.0, dist);
        
        // Combine core and outer glow with enhanced brightness
        float glow = coreGlow * 3.5 + outerGlow * glowStrength * 1.5;
        
        // Add dramatic pulsing with multiple frequencies
        float pulse1 = sin(time * 3.0) * 0.2 + 0.8;
        float pulse2 = sin(time * 7.0 + 1.57) * 0.15 + 0.85;
        float burst = max(0.0, sin(time * 15.0)) * 0.5;
        glow *= pulse1 * pulse2 + burst;
        
        // Apply intensity with enhanced HDR-ready color
        vec3 glowColor = color * glow * intensity * 1.5;
        
        // Add corona effect for extra luminosity
        float corona = pow(outerGlow, 0.5) * intensity * 0.5;
        glowColor += color * corona;
        
        // Add dynamic color variation based on intensity
        if (intensity > 1.0) {
            glowColor += vec3(0.3, 0.15, 0.05) * pow(intensity - 1.0, 1.5);
            // Add white hot core for very bright fireflies
            if (intensity > 1.3) {
                glowColor += vec3(0.5, 0.4, 0.3) * (intensity - 1.3);
            }
        }
        
        // Soft edge fade
        float alpha = outerGlow * intensity;
        
        gl_FragColor = vec4(glowColor, alpha);
    }
`;

// Instanced version for optimization
export const instancedFireflyVertexShader = `
    attribute vec3 instancePosition;
    attribute float instanceScale;
    attribute float instanceIntensity;
    attribute vec3 instanceColor;
    
    varying vec2 vUv;
    varying vec3 vColor;
    varying float vIntensity;
    
    void main() {
        vUv = uv;
        vColor = instanceColor;
        vIntensity = instanceIntensity;
        
        vec3 transformed = position * instanceScale + instancePosition;
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

export const instancedFireflyFragmentShader = `
    uniform float time;
    uniform float glowStrength;
    uniform float coreSize;
    
    varying vec2 vUv;
    varying vec3 vColor;
    varying float vIntensity;
    
    void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        
        float coreGlow = 1.0 - smoothstep(0.0, coreSize, dist);
        float outerGlow = 1.0 - smoothstep(coreSize, 1.0, dist);
        
        float glow = coreGlow * 3.5 + outerGlow * glowStrength * 1.5;
        
        vec3 glowColor = vColor * glow * vIntensity * 1.5;
        
        float corona = pow(outerGlow, 0.5) * vIntensity * 0.5;
        glowColor += vColor * corona;
        
        if (vIntensity > 1.0) {
            glowColor += vec3(0.3, 0.15, 0.05) * pow(vIntensity - 1.0, 1.5);
            if (vIntensity > 1.3) {
                glowColor += vec3(0.5, 0.4, 0.3) * (vIntensity - 1.3);
            }
        }
        
        float alpha = outerGlow * vIntensity;
        
        gl_FragColor = vec4(glowColor, alpha);
    }
`;