export const swirlVertexShader = `
    attribute float size;
    attribute float alpha;
    attribute float time;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    uniform float uTime;
    uniform float uPixelRatio;
    
    void main() {
        vColor = color;
        vAlpha = alpha;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // Add some pulsing to the size based on time
        float pulse = 1.0 + 0.2 * sin(time * 4.0 + uTime);
        
        gl_PointSize = size * pulse * uPixelRatio * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

export const swirlFragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    
    uniform float uGlowIntensity;
    
    void main() {
        // Create circular particle with glow
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        // Soft edge with glow
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        
        // Add extra glow
        float glow = exp(-dist * 3.0) * 0.5;
        alpha += glow;
        
        // Apply color with glow intensity
        vec3 finalColor = vColor * (1.0 + glow * uGlowIntensity);
        
        gl_FragColor = vec4(finalColor, alpha * vAlpha);
        
        // Discard fully transparent pixels
        if (gl_FragColor.a < 0.01) discard;
    }
`;