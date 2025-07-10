class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.animationId = null;
        
        this.init();
        this.animate();
        this.setupEventListeners();
    }
    
    init() {
        this.resizeCanvas();
        this.createParticles();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        const particleCount = Math.min(80, Math.floor((this.canvas.width * this.canvas.height) / 15000));
        
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 3 + 1;
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const velocityX = (Math.random() - 0.5) * 0.5;
            const velocityY = (Math.random() - 0.5) * 0.5;
            const opacity = Math.random() * 0.5 + 0.2;
            
            this.particles.push({
                x,
                y,
                size,
                baseSize: size,
                velocityX,
                velocityY,
                opacity,
                baseOpacity: opacity,
                angle: Math.random() * Math.PI * 2,
                angleVelocity: (Math.random() - 0.5) * 0.02,
                orbitRadius: Math.random() * 50 + 20
            });
        }
    }
    
    updateParticle(particle) {
        // Organic circular motion
        particle.angle += particle.angleVelocity;
        const orbitX = Math.cos(particle.angle) * particle.orbitRadius * 0.1;
        const orbitY = Math.sin(particle.angle) * particle.orbitRadius * 0.1;
        
        particle.x += particle.velocityX + orbitX;
        particle.y += particle.velocityY + orbitY;
        
        // Mouse interaction
        if (this.mouse.x !== null) {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouse.radius) {
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const forceX = (dx / distance) * force * 2;
                const forceY = (dy / distance) * force * 2;
                
                particle.x -= forceX;
                particle.y -= forceY;
                
                // Enhance visibility near mouse
                particle.opacity = Math.min(particle.baseOpacity + force * 0.3, 1);
                particle.size = particle.baseSize + force * 2;
            } else {
                // Gradually return to base values
                particle.opacity += (particle.baseOpacity - particle.opacity) * 0.05;
                particle.size += (particle.baseSize - particle.size) * 0.05;
            }
        }
        
        // Wrap around edges
        if (particle.x < -50) particle.x = this.canvas.width + 50;
        if (particle.x > this.canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = this.canvas.height + 50;
        if (particle.y > this.canvas.height + 50) particle.y = -50;
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.opacity;
        
        // Create gradient for each particle
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.5, '#f59e0b');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    const opacity = (1 - distance / 120) * 0.15;
                    this.ctx.save();
                    this.ctx.globalAlpha = opacity;
                    this.ctx.strokeStyle = '#fbbf24';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (const particle of this.particles) {
            this.updateParticle(particle);
            this.drawParticle(particle);
        }
        
        // Connect nearby particles
        this.connectParticles();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    setupEventListeners() {
        // Mouse move
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        // Mouse leave
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
        
        // Touch events for mobile
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
            }
        });
        
        window.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
        
        // Resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.particles = [];
            this.createParticles();
        });
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize particle system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const particleSystem = new ParticleSystem();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        particleSystem.destroy();
    });
});