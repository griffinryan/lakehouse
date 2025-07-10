export const swirlingBackgroundVertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const swirlingBackgroundFragmentShader = `
    uniform float time;
    uniform vec2 resolution;
    uniform float intensity;
    
    varying vec2 vUv;
    
    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
    
    // Create swirling flow field
    vec2 swirl(vec2 uv, float t) {
        float angle = snoise(uv * 3.0 + t * 0.1) * 6.28;
        float strength = snoise(uv * 2.0 - t * 0.05) * 0.5 + 0.5;
        return vec2(cos(angle), sin(angle)) * strength * 0.02;
    }
    
    // Van Gogh style turbulence
    float turbulence(vec2 uv, float t) {
        float value = 0.0;
        float amplitude = 1.0;
        float frequency = 1.0;
        
        for(int i = 0; i < 5; i++) {
            value += abs(snoise(uv * frequency + t * 0.02 * float(i))) * amplitude;
            frequency *= 2.0;
            amplitude *= 0.5;
        }
        
        return value;
    }
    
    void main() {
        vec2 uv = vUv;
        float t = time * 0.5;
        
        // Create multiple swirling layers
        vec2 distortion = vec2(0.0);
        for(int i = 0; i < 3; i++) {
            float layerTime = t * (1.0 + float(i) * 0.1);
            vec2 layerUV = uv + distortion;
            distortion += swirl(layerUV * (2.0 + float(i)), layerTime);
        }
        
        // Apply distortion to create flow
        vec2 flowUV = uv + distortion;
        
        // Create Van Gogh style patterns
        float pattern1 = turbulence(flowUV * 4.0, t);
        float pattern2 = turbulence(flowUV * 8.0 + vec2(100.0), t * 1.3);
        float pattern3 = snoise(flowUV * 15.0 + t * 0.1) * 0.5 + 0.5;
        
        // Color palette inspired by Starry Night
        vec3 deepBlue = vec3(0.05, 0.05, 0.2);
        vec3 midBlue = vec3(0.1, 0.15, 0.4);
        vec3 lightBlue = vec3(0.2, 0.3, 0.6);
        vec3 pink = vec3(0.4, 0.2, 0.3);
        vec3 darkPurple = vec3(0.15, 0.05, 0.2);
        
        // Blend colors based on patterns
        vec3 color = deepBlue;
        color = mix(color, midBlue, smoothstep(0.3, 0.7, pattern1));
        color = mix(color, lightBlue, smoothstep(0.4, 0.8, pattern2) * 0.5);
        color = mix(color, pink, smoothstep(0.6, 0.9, pattern3) * 0.3);
        color = mix(color, darkPurple, smoothstep(0.0, 0.3, pattern1) * 0.4);
        
        // Add subtle pulsing
        float pulse = sin(t * 0.5) * 0.05 + 0.95;
        color *= pulse;
        
        // Add vortex highlights
        float vortex = snoise(flowUV * 20.0 + t * 0.2);
        if(vortex > 0.7) {
            color += vec3(0.1, 0.05, 0.15) * (vortex - 0.7) * 3.0;
        }
        
        // Apply intensity
        color *= intensity;
        
        // Add subtle vignette
        float vignette = 1.0 - length(uv - 0.5) * 0.5;
        color *= vignette;
        
        gl_FragColor = vec4(color, 1.0);
    }
`;