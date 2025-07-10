export const vanGoghLayerVertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vFogDepth;
    
    uniform float fogNear;
    uniform float fogFar;
    
    void main() {
        vUv = uv;
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        vec4 mvPosition = viewMatrix * worldPosition;
        vFogDepth = -mvPosition.z;
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

export const vanGoghLayerFragmentShader = `
    uniform float time;
    uniform vec2 resolution;
    uniform float layerIndex;
    uniform float opacity;
    uniform float swirls;
    uniform float brushDensity;
    uniform float colorShift;
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vFogDepth;
    
    // Improved 3D noise for organic patterns
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
               
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    // Paint brush stroke with depth
    float brushStroke(vec2 uv, float angle, float width, float depth) {
        vec2 rotated = vec2(
            uv.x * cos(angle) - uv.y * sin(angle),
            uv.x * sin(angle) + uv.y * cos(angle)
        );
        
        float edge = snoise(vec3(rotated * 40.0, depth)) * 0.1;
        float stroke = 1.0 - smoothstep(0.0, width + edge, abs(rotated.y));
        
        float texture = snoise(vec3(rotated * 60.0, depth + 1.0)) * 0.3 + 0.7;
        
        return stroke * texture;
    }
    
    // Swirling vortex pattern
    vec2 vortex(vec2 uv, vec2 center, float strength, float time) {
        vec2 offset = uv - center;
        float dist = length(offset);
        float angle = atan(offset.y, offset.x);
        
        angle += strength / (dist + 0.1) * sin(time * 0.4);
        
        float distortion = snoise(vec3(uv * 2.5, time * 0.1)) * 0.4;
        angle += distortion * (1.0 - dist * 0.5);
        
        return center + vec2(cos(angle), sin(angle)) * dist;
    }
    
    // Layer-specific turbulence
    float layeredTurbulence(vec2 uv, float time, int octaves, float layerOffset) {
        float value = 0.0;
        float amplitude = 1.0;
        vec2 shift = vec2(layerOffset * 10.0);
        
        for(int i = 0; i < octaves; i++) {
            float layer = float(i);
            vec2 coord = uv + shift;
            
            vec2 flow = vec2(
                sin(time * (0.08 + layer * 0.04) + layer + layerOffset),
                cos(time * (0.06 + layer * 0.03) + layer * 1.5 + layerOffset)
            ) * 0.15;
            
            coord += flow;
            
            float noise = snoise(vec3(coord * (1.5 + layer * 0.5), time * 0.04 + layer + layerOffset));
            value += abs(noise) * amplitude;
            
            shift += vec2(noise) * 0.4;
            amplitude *= 0.65;
        }
        
        return value;
    }
    
    // Paint mixing with layer depth
    vec3 mixPaintColors(vec3 color1, vec3 color2, float factor, float texture, float depth) {
        float mixFactor = pow(factor, 1.3) * texture;
        vec3 mixed = mix(color1, color2, mixFactor);
        
        mixed += vec3(
            snoise(vec3(mixed.xy * 12.0, depth)) * 0.04,
            snoise(vec3(mixed.yz * 12.0, depth + 1.0)) * 0.04,
            snoise(vec3(mixed.zx * 12.0, depth + 2.0)) * 0.04
        );
        
        return mixed;
    }
    
    void main() {
        vec2 uv = vUv;
        vec2 centeredUV = uv - 0.5;
        float t = time * 0.35;
        float layerDepth = layerIndex;
        
        // Create vortex centers based on layer
        vec2 vortexUV = uv;
        
        // Different vortex patterns per layer
        if(layerIndex < 0.5) {
            // Furthest layer - biggest swirls
            vortexUV = vortex(vortexUV, vec2(0.7, 0.65), 0.4, t);
            vortexUV = vortex(vortexUV, vec2(0.25, 0.35), 0.35, t * 0.9);
            vortexUV = vortex(vortexUV, vec2(0.5, 0.85), 0.3, t * 1.1);
            vortexUV = vortex(vortexUV, vec2(0.8, 0.2), 0.25, t * 0.8);
        } else if(layerIndex < 1.5) {
            // Middle layer
            vortexUV = vortex(vortexUV, vec2(0.6, 0.5), 0.3, t * 1.1);
            vortexUV = vortex(vortexUV, vec2(0.3, 0.6), 0.25, t);
            vortexUV = vortex(vortexUV, vec2(0.75, 0.75), 0.2, t * 1.2);
        } else {
            // Nearest layer - subtler swirls
            vortexUV = vortex(vortexUV, vec2(0.4, 0.4), 0.2, t * 1.2);
            vortexUV = vortex(vortexUV, vec2(0.65, 0.65), 0.15, t * 1.1);
        }
        
        // Multi-layered turbulence with layer-specific parameters
        float turb1 = layeredTurbulence(vortexUV * (2.0 + layerIndex * 0.5), t, int(5.0 - layerIndex), layerIndex);
        float turb2 = layeredTurbulence(vortexUV * (3.5 + layerIndex * 0.3) + vec2(10.0), t * 0.8, 4, layerIndex + 1.0);
        float turb3 = layeredTurbulence(vortexUV * (5.0 + layerIndex * 0.2) + vec2(20.0), t * 1.2, 3, layerIndex + 2.0);
        
        // Create paint brush strokes
        float brushPattern = 0.0;
        int brushCount = int(brushDensity);
        for(int i = 0; i < 12; i++) {
            if(i >= brushCount) break;
            
            float angle = float(i) * 0.52 + turb1 * 0.4 + layerIndex * 0.3;
            vec2 strokeUV = vortexUV * (8.0 + layerIndex * 2.0) + vec2(float(i) * 1.5);
            float strokeWidth = 0.08 + turb2 * 0.04 + layerIndex * 0.02;
            brushPattern += brushStroke(strokeUV, angle, strokeWidth, layerDepth) * (0.4 - layerIndex * 0.05);
        }
        
        // Layer-specific color palettes
        vec3 deepNightBlack = vec3(0.02, 0.02, 0.05);
        vec3 midnightPurple = vec3(0.08, 0.05, 0.15);
        vec3 deepPurple = vec3(0.15, 0.08, 0.25);
        vec3 royalPurple = vec3(0.25, 0.15, 0.45);
        vec3 prussianBlue = vec3(0.1, 0.15, 0.3);
        vec3 midnightBlue = vec3(0.15, 0.2, 0.35);
        vec3 cobaltBlue = vec3(0.2, 0.3, 0.5);
        vec3 moonGlow = vec3(0.8, 0.75, 0.4);
        vec3 starLight = vec3(0.9, 0.9, 0.85);
        
        // Base color varies by layer
        vec3 color;
        if(layerIndex < 0.5) {
            // Furthest layer - darkest
            color = deepNightBlack;
        } else if(layerIndex < 1.5) {
            // Middle layer
            color = mix(deepNightBlack, midnightPurple, 0.5);
        } else {
            // Nearest layer
            color = midnightPurple;
        }
        
        // Apply color shifts based on layer
        color = mix(color, midnightPurple, colorShift);
        
        // Layer 1: Deep purple swirls
        float swirl1 = smoothstep(0.15, 0.6, turb1);
        color = mixPaintColors(color, deepPurple, swirl1, brushPattern + 0.5, layerDepth);
        
        // Layer 2: Royal purple highlights
        float swirl2 = smoothstep(0.25, 0.7, turb2);
        color = mixPaintColors(color, royalPurple, swirl2 * 0.8, 1.0 - brushPattern * 0.5, layerDepth);
        
        // Layer 3: Blue tones
        float swirl3 = smoothstep(0.35, 0.75, turb3);
        if(layerIndex < 1.5) {
            color = mixPaintColors(color, prussianBlue, swirl3 * 0.6, turb1, layerDepth);
        } else {
            color = mixPaintColors(color, midnightBlue, swirl3 * 0.5, turb1, layerDepth);
        }
        
        // Add cobalt blue accents
        float cobaltPattern = sin(turb1 * 4.0 + turb2 * 2.5) * 0.5 + 0.5;
        color = mixPaintColors(color, cobaltBlue, cobaltPattern * 0.3, brushPattern, layerDepth);
        
        // Impasto texture
        float impasto = snoise(vec3(uv * 60.0, t * 0.03 + layerDepth));
        color *= 1.0 + impasto * 0.08;
        
        // Stars only on furthest layer
        if(layerIndex < 0.5) {
            float stars = snoise(vec3(uv * 120.0, 5.0));
            if(stars > 0.88) {
                float starIntensity = pow((stars - 0.88) * 10.0, 2.0);
                color = mix(color, starLight, starIntensity);
            }
            
            // Moon glow
            float moonDist = length(uv - vec2(0.85, 0.8));
            if(moonDist < 0.12) {
                float moonIntensity = 1.0 - moonDist / 0.12;
                moonIntensity = pow(moonIntensity, 1.5);
                color = mix(color, moonGlow, moonIntensity * 0.4);
            }
        }
        
        // Brush stroke highlights
        float strokeHighlight = brushPattern * turb1 * (1.0 - layerIndex * 0.2);
        color += vec3(0.03, 0.02, 0.08) * strokeHighlight;
        
        // Subtle animation
        color *= 0.97 + sin(t + layerIndex) * 0.03;
        
        // Vignette effect
        float vignette = 1.0 - length(centeredUV) * 0.6;
        vignette = pow(vignette, 1.3);
        color *= vignette;
        
        // Apply fog
        float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
        color = mix(color, fogColor, fogFactor * 0.7);
        
        // Final paint texture
        float finalTexture = snoise(vec3(uv * 100.0, layerDepth)) * 0.06 + 0.94;
        color *= finalTexture;
        
        gl_FragColor = vec4(color, opacity);
    }
`;