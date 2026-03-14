/**
 * 场景系统 - 管理不同主题的战场场景
 */
class SceneManager {
    constructor(game) {
        this.game = game;
        this.currentScene = 'land'; // 默认陆地
        this.scenes = this.defineScenes();
    }

    defineScenes() {
        return {
            // 陆地场景 - 默认
            land: {
                name: '陆地',
                icon: '🏔️',
                background: {
                    top: '#1a1f2e',
                    bottom: '#0d1117',
                    gradient: ['#161b22', '#0d1117']
                },
                road: {
                    alpha: 0.12,
                    lineAlpha: 0.5,
                    lineDash: [10, 10]
                },
                base: {
                    player: '#21262d',
                    enemy: '#21262d',
                    border: '#8b949e'
                },
                hero: {
                    bg: 'rgba(35, 134, 54, 0.1)',
                    border: 'rgba(35, 134, 54, 0.3)',
                    color: '#2ea043'
                },
                troop: {
                    bg: 'rgba(88, 166, 255, 0.08)',
                    border: 'rgba(88, 166, 255, 0.25)'
                },
                particles: {
                    type: 'ember',
                    count: 40,
                    colors: ['#ff6b35', '#f7931e', '#ffd700', '#ff4500']
                }
            },

            // 海底场景
            ocean: {
                name: '海底',
                icon: '🌊',
                background: {
                    top: '#0a1628',
                    bottom: '#001a33',
                    gradient: ['#0d2847', '#001a33']
                },
                road: {
                    alpha: 0.2,
                    lineAlpha: 0.6,
                    lineDash: [15, 15]
                },
                base: {
                    player: '#0d2847',
                    enemy: '#0d2847',
                    border: '#4fc3f7'
                },
                hero: {
                    bg: 'rgba(0, 150, 136, 0.15)',
                    border: 'rgba(0, 150, 136, 0.4)',
                    color: '#00bcd4'
                },
                troop: {
                    bg: 'rgba(33, 150, 243, 0.12)',
                    border: 'rgba(33, 150, 243, 0.3)'
                },
                particles: {
                    type: 'bubble',
                    count: 50,
                    colors: ['rgba(79, 195, 247, 0.6)', 'rgba(128, 222, 234, 0.5)', 'rgba(178, 235, 242, 0.4)', 'rgba(255, 255, 255, 0.3)']
                }
            },

            // 太空场景
            space: {
                name: '太空',
                icon: '🚀',
                background: {
                    top: '#0a0a0a',
                    bottom: '#000000',
                    gradient: ['#0d0d1a', '#000000']
                },
                road: {
                    alpha: 0.08,
                    lineAlpha: 0.7,
                    lineDash: [5, 15]
                },
                base: {
                    player: '#1a1a2e',
                    enemy: '#1a1a2e',
                    border: '#9c27b0'
                },
                hero: {
                    bg: 'rgba(156, 39, 176, 0.15)',
                    border: 'rgba(156, 39, 176, 0.4)',
                    color: '#e91e63'
                },
                troop: {
                    bg: 'rgba(103, 58, 183, 0.12)',
                    border: 'rgba(103, 58, 183, 0.3)'
                },
                particles: {
                    type: 'star',
                    count: 50,
                    color: 'rgba(255, 255, 255, 0.8)'
                }
            },

            // 草原场景
            grassland: {
                name: '草原',
                icon: '🌿',
                background: {
                    top: '#1b3a1b',
                    bottom: '#0d2818',
                    gradient: ['#1e4620', '#0d2818']
                },
                road: {
                    alpha: 0.15,
                    lineAlpha: 0.5,
                    lineDash: [8, 8]
                },
                base: {
                    player: '#1e4620',
                    enemy: '#1e4620',
                    border: '#8bc34a'
                },
                hero: {
                    bg: 'rgba(139, 195, 74, 0.15)',
                    border: 'rgba(139, 195, 74, 0.4)',
                    color: '#cddc39'
                },
                troop: {
                    bg: 'rgba(76, 175, 80, 0.12)',
                    border: 'rgba(76, 175, 80, 0.3)'
                },
                particles: {
                    type: 'pollen',
                    count: 60,
                    colors: ['rgba(255, 215, 0, 0.7)', 'rgba(255, 236, 139, 0.6)', 'rgba(255, 255, 200, 0.5)', 'rgba(255, 182, 193, 0.4)']
                }
            }
        };
    }

    getCurrentScene() {
        return this.scenes[this.currentScene];
    }

    switchScene(sceneKey) {
        if (this.scenes[sceneKey]) {
            this.currentScene = sceneKey;
            return true;
        }
        return false;
    }

    getSceneList() {
        return Object.keys(this.scenes).map(key => ({
            key,
            name: this.scenes[key].name,
            icon: this.scenes[key].icon
        }));
    }

    // 绘制场景背景
    drawBackground(ctx, width, height) {
        const scene = this.getCurrentScene();
        const bg = scene.background;

        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, bg.gradient[0]);
        gradient.addColorStop(1, bg.gradient[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 绘制场景特效
        if (scene.particles) {
            this.drawParticles(ctx, width, height, scene.particles);
        }
    }

    // 绘制粒子效果
    drawParticles(ctx, width, height, particles) {
        const time = Date.now() / 1000;
        const colors = particles.colors || [particles.color];

        for (let i = 0; i < particles.count; i++) {
            const seed = i * 137.5;
            const color = colors[i % colors.length];
            ctx.fillStyle = color;

            if (particles.type === 'bubble') {
                // 海底气泡效果 - 更明显的渐变色气泡
                const x = (Math.sin(seed * 0.5 + time * 0.2) * 0.4 + 0.5) * width;
                const bubbleY = ((time * 30 + seed * 80) % (height + 100)) - 50;
                const size = 3 + Math.sin(seed) * 2 + (bubbleY / height) * 4;
                const alpha = 0.4 + Math.sin(seed + time * 2) * 0.3;

                ctx.globalAlpha = alpha;
                // 气泡光晕
                const gradient = ctx.createRadialGradient(x, bubbleY, 0, x, bubbleY, size);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                gradient.addColorStop(0.5, color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, bubbleY, size * 1.5, 0, Math.PI * 2);
                ctx.fill();

                // 气泡高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(x - size * 0.3, bubbleY - size * 0.3, size * 0.2, 0, Math.PI * 2);
                ctx.fill();

            } else if (particles.type === 'star') {
                // 星星效果 - 闪烁
                const x = (Math.sin(seed + time * 0.05) * 0.5 + 0.5) * width;
                const y = (Math.cos(seed * 1.3) * 0.5 + 0.5) * height;
                const twinkle = Math.sin(seed + time * (2 + Math.sin(seed) * 2)) * 0.5 + 0.5;
                const size = (Math.sin(seed * 2) * 0.5 + 0.5) * 2 + 1;

                ctx.globalAlpha = 0.3 + twinkle * 0.7;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                // 十字闪光
                if (twinkle > 0.7) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = (twinkle - 0.7) * 2;
                    ctx.beginPath();
                    ctx.moveTo(x - size * 2, y);
                    ctx.lineTo(x + size * 2, y);
                    ctx.moveTo(x, y - size * 2);
                    ctx.lineTo(x, y + size * 2);
                    ctx.stroke();
                }

            } else if (particles.type === 'ember') {
                // 陆地火芬效果 - 向上飘动的火芬
                const x = (Math.sin(seed * 0.3 + time * 0.1) * 0.45 + 0.5) * width;
                const emberY = height - ((time * 40 + seed * 60) % (height + 100)) + 50;
                const driftX = Math.sin(seed + time * 2) * 20;
                const size = 2 + Math.sin(seed * 3) * 2;
                const alpha = Math.min(1, (height - emberY) / 200) * (0.6 + Math.sin(seed + time * 3) * 0.4);

                ctx.globalAlpha = alpha;
                // 火芬光晕
                const gradient = ctx.createRadialGradient(x + driftX, emberY, 0, x + driftX, emberY, size * 2);
                gradient.addColorStop(0, color);
                gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x + driftX, emberY, size * 2, 0, Math.PI * 2);
                ctx.fill();

                // 核心
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x + driftX, emberY, size * 0.5, 0, Math.PI * 2);
                ctx.fill();

            } else if (particles.type === 'pollen') {
                // 草原花粉效果 - 飘浮的彩色光点
                const x = (Math.sin(seed * 0.4 + time * 0.15) * 0.5 + 0.5) * width;
                const y = (Math.cos(seed * 0.6 + time * 0.1) * 0.5 + 0.5) * height;
                const floatY = y + Math.sin(seed + time * 2) * 30;
                const floatX = x + Math.cos(seed * 1.5 + time * 1.5) * 20;
                const size = 2 + Math.sin(seed * 2) * 1.5;
                const alpha = 0.5 + Math.sin(seed + time * 2) * 0.3;

                ctx.globalAlpha = alpha;
                // 花粉光晕
                const gradient = ctx.createRadialGradient(floatX, floatY, 0, floatX, floatY, size * 2);
                gradient.addColorStop(0, color);
                gradient.addColorStop(0.7, color.replace('0.7)', '0.2)').replace('0.6)', '0.15)').replace('0.5)', '0.1)').replace('0.4)', '0.05)'));
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(floatX, floatY, size * 2, 0, Math.PI * 2);
                ctx.fill();

                // 亮心
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(floatX, floatY, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
    }
}
