/**
 * 游戏主类 - 管理游戏循环和全局状态
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // 游戏状态
        this.running = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;

        // 实体管理
        this.entities = [];
        this.entityPool = null;
        this.nextEntityId = 1;

        // 系统
        this.moveSystem = new MoveSystem(this);
        this.collisionSystem = new CollisionSystem(this);
        this.renderSystem = new RenderSystem(this);

        // 场景管理器
        this.sceneManager = new SceneManager(this);

        // 布局配置 - 新设计
        this.layout = {
            // 我方区域（底部，较大）
            playerBase: { y: 720, height: 80 },      // 大门/血条区域
            heroZone: { y: 620, height: 80 },        // 英雄站位
            troopZone: { y: 520, height: 80 },       // 士兵屯兵区

            // 敌方区域（顶部，较小）
            enemyBase: { y: 40, height: 40 },

            // 战场区域
            battlefieldTop: 100,
            battlefieldBottom: 500
        };

        // 路数配置 (1, 2, 或 3)
        this.laneCount = 3;

        // 定义不同路数的配置
        this.laneConfigs = {
            1: [
                {
                    name: '中路',
                    speedMod: 1.0,
                    color: '#238636',
                    playerX: 250,
                    enemyX: 250,
                    curve: 0
                }
            ],
            2: [
                {
                    name: '左路',
                    speedMod: 0.95,
                    color: '#58a6ff',
                    playerX: 150,
                    enemyX: 150,
                    curve: 0
                },
                {
                    name: '右路',
                    speedMod: 0.95,
                    color: '#f85149',
                    playerX: 350,
                    enemyX: 350,
                    curve: 0
                }
            ],
            3: [
                {
                    name: '左路',
                    speedMod: 0.9,
                    color: '#58a6ff',
                    playerX: 80,
                    enemyX: 120,
                    curve: -0.8
                },
                {
                    name: '中路',
                    speedMod: 1.0,
                    color: '#238636',
                    playerX: 250,
                    enemyX: 250,
                    curve: 0
                },
                {
                    name: '右路',
                    speedMod: 0.9,
                    color: '#f85149',
                    playerX: 420,
                    enemyX: 380,
                    curve: 0.8
                }
            ]
        };

        // 当前使用的路配置
        this.lanes = this.laneConfigs[3];

        // 基地血量 - 降低为300，加快游戏节奏
        this.playerBaseHP = 300;
        this.playerBaseMaxHP = 300;
        this.enemyBaseHP = 300;
        this.enemyBaseMaxHP = 300;

        // 士气系统
        this.morale = {
            player: 100,  // 玩家士气 (0-200)
            enemy: 100    // 敌方士气 (0-200)
        };
        this.casualties = {
            player: 0,    // 玩家战损统计
            enemy: 0      // 敌方战损统计
        };

        // 胜负状态
        this.gameOver = false;
        this.gameResult = null;  // 'victory' | 'defeat'
        this.gameOverTime = 0;

        // 屯兵数量
        this.troops = {
            0: { count: 0, type: 'sword', level: 1 },  // 左路
            1: { count: 0, type: 'sword', level: 1 },  // 中路
            2: { count: 0, type: 'sword', level: 1 }   // 右路
        };

        // 英雄状态
        this.heroes = {
            0: { hp: 500, maxHp: 500, level: 1, skillCD: 0 },  // 左路
            1: { hp: 500, maxHp: 500, level: 1, skillCD: 0 },  // 中路
            2: { hp: 500, maxHp: 500, level: 1, skillCD: 0 }   // 右路
        };

        // 出兵台词配置
        this.spawnQuotes = {
            melee: [
                '冲啊！', '为了荣耀！', '杀！', '前进！',
                '跟我上！', '碾碎他们！', '战无不胜！', '冲阵！'
            ],
            ranged: [
                '瞄准！', '火力压制！', '箭无虚发！', '远程支援！',
                '射击！', '掩护队友！', '百步穿杨！', '放！'
            ],
            tank: [
                '坚不可摧！', '我来扛！', '铜墙铁壁！', '挡在前面！',
                '无所畏惧！', '守护队友！', '铁壁防御！', '顶住！'
            ]
        };

        // 当前显示的台词
        this.activeQuotes = [];

        this.init();
    }

    init() {
        // 初始化对象池
        this.entityPool = new ObjectPool(
            () => new Entity(this.nextEntityId++),
            (entity) => entity.reset(),
            50
        );

        // 悬停的屯兵格子
        this.hoveredTroopLane = -1;

        // 绑定 canvas 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    // 获取鼠标在 canvas 上的坐标
    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // 获取鼠标所在的屯兵格子 lane index（-1 表示不在任何格子上）
    getTroopLaneAt(x, y) {
        const troopY = this.layout.troopZone.y;
        if (y < troopY - 25 || y > troopY + 25) return -1;
        for (let i = 0; i < this.laneCount; i++) {
            const laneX = this.lanes[i].playerX;
            if (x >= laneX - 45 && x <= laneX + 45) return i;
        }
        return -1;
    }

    // 处理鼠标移动（悬停高亮屯兵槽）
    handleMouseMove(e) {
        if (!this.running || this.gameOver) return;
        const { x, y } = this.getCanvasPos(e);
        const lane = this.getTroopLaneAt(x, y);
        this.hoveredTroopLane = lane;
        this.canvas.style.cursor = (lane >= 0 && this.troops[lane]?.count > 0) ? 'pointer' : 'default';
    }

    // 处理 canvas 点击（点击屯兵区出兵）
    handleCanvasClick(e) {
        if (!this.running || this.gameOver) return;
        const { x, y } = this.getCanvasPos(e);
        const lane = this.getTroopLaneAt(x, y);
        if (lane >= 0 && this.troops[lane] && this.troops[lane].count > 0) {
            this.spawnUnit(lane, 0);
        }
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
    }

    loop(currentTime) {
        if (!this.running) return;

        // 计算deltaTime
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // 限制最大deltaTime（防止切回标签页时的跳帧）
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        // 更新FPS
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        // 更新系统
        this.update();

        // 渲染
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        // 游戏已结束则不更新
        if (this.gameOver) return;

        // 移动系统
        this.moveSystem.update(this.entities, this.deltaTime);

        // 碰撞检测
        this.collisionSystem.update(this.entities);

        // 清理死亡实体并统计战损
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (!entity.active) {
                // 统计战损
                if (entity.team === 0) {
                    this.casualties.player++;
                } else {
                    this.casualties.enemy++;
                }
                this.updateMorale();

                this.entityPool.release(entity);
                this.entities.splice(i, 1);
            }
        }

        // 检查胜负
        this.checkGameOver();

        // 更新技能CD和自动释放
        this.updateHeroSkills();

        // 更新技能特效
        this.updateSkillEffects();

        // 更新台词显示
        this.updateQuotes();
    }

    // 检查胜负
    checkGameOver() {
        if (this.gameOver) return;

        if (this.enemyBaseHP <= 0) {
            this.enemyBaseHP = 0;
            this.gameOver = true;
            this.gameResult = 'victory';
            this.gameOverTime = performance.now();
        } else if (this.playerBaseHP <= 0) {
            this.playerBaseHP = 0;
            this.gameOver = true;
            this.gameResult = 'defeat';
            this.gameOverTime = performance.now();
        }
    }

    // 更新台词
    updateQuotes() {
        for (let i = this.activeQuotes.length - 1; i >= 0; i--) {
            const quote = this.activeQuotes[i];
            quote.life -= this.deltaTime;

            // 跟随实体移动
            if (quote.entity && quote.entity.active) {
                quote.x = quote.entity.position.x;
                quote.y = quote.entity.position.y - 35;
            }

            // 移除过期的台词
            if (quote.life <= 0) {
                this.activeQuotes.splice(i, 1);
            }
        }
    }

    // 英雄技能配置
    heroSkills = {
        0: { // 左路英雄 - 雷霆一击
            name: '雷霆一击',
            damage: 100,
            cooldown: 8,
            range: 120,
            effect: 'thunder',
            color: '#58a6ff'
        },
        1: { // 中路英雄 - 烈焰风暴
            name: '烈焰风暴',
            damage: 150,
            cooldown: 10,
            range: 100,
            effect: 'fire',
            color: '#ff6b35'
        },
        2: { // 右路英雄 - 圣光审判
            name: '圣光审判',
            damage: 120,
            cooldown: 9,
            range: 110,
            effect: 'holy',
            color: '#ffd700'
        }
    };

    // 技能特效
    skillEffects = [];

    // 更新英雄技能
    updateHeroSkills() {
        const now = performance.now();

        for (let i = 0; i < this.laneCount; i++) {
            const hero = this.heroes[i];
            if (!hero) continue;

            // 更新CD
            if (hero.skillCD > 0) {
                hero.skillCD -= this.deltaTime;
                continue;
            }

            // 寻找技能目标
            const skill = this.heroSkills[i];
            const target = this.findSkillTarget(i, skill.range);

            if (target) {
                this.castHeroSkill(i, target, skill, now);
                hero.skillCD = skill.cooldown;
            }
        }
    }

    // 寻找技能目标
    findSkillTarget(laneIndex, range) {
        const heroX = this.lanes[laneIndex].playerX;
        const heroY = this.layout.heroZone.y;

        let bestTarget = null;
        let maxEnemyCount = 0;

        for (const entity of this.entities) {
            if (!entity.active || entity.team === 0) continue;
            if (entity.lane !== laneIndex) continue;

            const dist = Math.sqrt(
                Math.pow(entity.position.x - heroX, 2) +
                Math.pow(entity.position.y - heroY, 2)
            );

            if (dist <= range) {
                // 计算该位置周围的敌人数量
                let enemyCount = 0;
                for (const other of this.entities) {
                    if (!other.active || other.team === 0) continue;
                    const otherDist = entity.position.distanceTo(other.position);
                    if (otherDist < 60) enemyCount++;
                }

                if (enemyCount > maxEnemyCount) {
                    maxEnemyCount = enemyCount;
                    bestTarget = entity;
                }
            }
        }

        return bestTarget;
    }

    // 释放英雄技能
    castHeroSkill(laneIndex, target, skill, now) {
        const heroX = this.lanes[laneIndex].playerX;
        const heroY = this.layout.heroZone.y;

        // 对范围内所有敌人造成伤害
        let hitCount = 0;
        for (const entity of this.entities) {
            if (!entity.active || entity.team === 0) continue;

            const dist = entity.position.distanceTo(target.position);
            if (dist <= 80) { // 技能范围
                entity.takeDamage(skill.damage, true);
                hitCount++;
            }
        }

        // 添加技能特效
        this.skillEffects.push({
            type: skill.effect,
            x: target.position.x,
            y: target.position.y,
            color: skill.color,
            startTime: now,
            duration: 1000,
            damage: skill.damage,
            hitCount: hitCount
        });

        // 添加技能台词
        this.activeQuotes.push({
            text: `${skill.name}!`,
            x: heroX,
            y: heroY - 50,
            life: 1.5,
            maxLife: 1.5,
            entity: null
        });
    }

    // 更新技能特效
    updateSkillEffects() {
        const now = performance.now();

        for (let i = this.skillEffects.length - 1; i >= 0; i--) {
            const effect = this.skillEffects[i];
            const elapsed = now - effect.startTime;

            if (elapsed >= effect.duration) {
                this.skillEffects.splice(i, 1);
            }
        }
    }

    render() {
        // 使用场景管理器绘制背景
        this.sceneManager.drawBackground(this.ctx, this.width, this.height);

        // 绘制战场背景
        this.drawBattlefield();

        // 渲染实体
        this.renderSystem.render(this.entities);

        // 绘制技能特效
        this.drawSkillEffects();

        // 绘制UI
        this.drawUI();

        // 绘制结算画面（覆盖在最上层）
        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    // 绘制游戏结算画面
    drawGameOver() {
        const ctx = this.ctx;
        const elapsed = (performance.now() - this.gameOverTime) / 1000;
        const fadeIn = Math.min(1, elapsed / 0.8); // 0.8秒淡入

        const isVictory = this.gameResult === 'victory';

        // 半透明遮罩
        ctx.fillStyle = isVictory
            ? `rgba(0, 20, 0, ${0.75 * fadeIn})`
            : `rgba(20, 0, 0, ${0.75 * fadeIn})`;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.globalAlpha = fadeIn;

        // 主标题
        const title = isVictory ? '胜 利' : '失 败';
        const titleColor = isVictory ? '#FFD700' : '#ff4444';

        ctx.shadowColor = titleColor;
        ctx.shadowBlur = 40;
        ctx.fillStyle = titleColor;
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, this.width / 2, this.height / 2 - 80);
        ctx.shadowBlur = 0;

        // 副标题
        ctx.fillStyle = '#fff';
        ctx.font = '22px sans-serif';
        ctx.fillText(
            isVictory ? '敌方据点已被攻破！' : '我方城门已被摧毁...',
            this.width / 2, this.height / 2 - 20
        );

        // 战报
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText(`击杀敌军: ${this.casualties.enemy}  我方战损: ${this.casualties.player}`, this.width / 2, this.height / 2 + 30);

        // 士气
        const moraleLabel = isVictory
            ? `最终士气: ${Math.round(this.morale.player)}`
            : `最终士气: ${Math.round(this.morale.player)}`;
        ctx.fillText(moraleLabel, this.width / 2, this.height / 2 + 60);

        // 重新开始提示（延迟1秒后显示）
        if (elapsed > 1.2) {
            const blinkAlpha = Math.sin(elapsed * 3) * 0.4 + 0.6;
            ctx.globalAlpha = fadeIn * blinkAlpha;
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.fillText('按 R 键重新开始', this.width / 2, this.height / 2 + 110);
        }

        ctx.restore();
    }

    // 绘制技能特效
    drawSkillEffects() {
        const now = performance.now();

        for (const effect of this.skillEffects) {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;

            this.drawEffectByType(effect, progress);
        }
    }

    // 根据类型绘制特效
    drawEffectByType(effect, progress) {
        const ctx = this.ctx;
        const x = effect.x;
        const y = effect.y;

        ctx.save();

        switch (effect.type) {
            case 'thunder':
                this.drawThunderEffect(ctx, x, y, effect.color, progress, effect);
                break;
            case 'fire':
                this.drawFireEffect(ctx, x, y, effect.color, progress, effect);
                break;
            case 'holy':
                this.drawHolyEffect(ctx, x, y, effect.color, progress, effect);
                break;
        }

        ctx.restore();
    }

    // 雷霆特效 - 增强版
    drawThunderEffect(ctx, x, y, color, progress, effect) {
        const alpha = 1 - progress;
        const scale = 1 + progress * 3;

        // 屏幕闪光效果
        if (progress < 0.1) {
            ctx.fillStyle = `rgba(88, 166, 255, ${0.3 * (1 - progress * 10)})`;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // 外圈冲击波
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = alpha;
        for (let i = 0; i < 4; i++) {
            const radius = 40 * scale + i * 25;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 主闪电（更粗更亮）
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + progress * Math.PI * 2;
            const len = 80 * scale;
            ctx.beginPath();
            ctx.moveTo(x, y);
            // 锯齿状闪电
            const midX = x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 20;
            const midY = y + Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY);
            ctx.lineTo(
                x + Math.cos(angle) * len,
                y + Math.sin(angle) * len
            );
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // 中心能量球
        const ballGradient = ctx.createRadialGradient(x, y, 0, x, y, 30 * scale);
        ballGradient.addColorStop(0, '#fff');
        ballGradient.addColorStop(0.5, color);
        ballGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = ballGradient;
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(x, y, 30 * scale, 0, Math.PI * 2);
        ctx.fill();

        // 伤害数字（更大更醒目）
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`⚡ ${effect.damage}`, x, y - 50 - progress * 40);
        ctx.shadowBlur = 0;

        // 命中数量
        ctx.fillStyle = '#58a6ff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`命中 ${effect.hitCount} 目标`, x, y - 25 - progress * 40);
    }

    // 火焰特效 - 增强版
    drawFireEffect(ctx, x, y, color, progress, effect) {
        const alpha = 1 - progress;
        const scale = 1 + progress * 2;

        // 屏幕红闪效果
        if (progress < 0.15) {
            ctx.fillStyle = `rgba(255, 107, 53, ${0.2 * (1 - progress * 6.67)})`;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // 多层火焰圈
        for (let ring = 0; ring < 3; ring++) {
            const ringScale = scale + ring * 0.3;
            const ringAlpha = alpha * (1 - ring * 0.3);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100 * ringScale);
            gradient.addColorStop(0, `rgba(255, 107, 53, ${ringAlpha})`);
            gradient.addColorStop(0.3, `rgba(255, 69, 0, ${ringAlpha * 0.8})`);
            gradient.addColorStop(0.7, `rgba(139, 0, 0, ${ringAlpha * 0.4})`);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 100 * ringScale, 0, Math.PI * 2);
            ctx.fill();
        }

        // 火焰粒子（更多更动态）
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 15;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + progress * 3;
            const dist = 40 + progress * 70 + Math.sin(progress * Math.PI * 4 + i) * 10;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            const size = Math.max(0.1, 12 * (1 - progress) + Math.random() * 5);

            ctx.fillStyle = `rgba(255, ${Math.floor(50 + i * 15)}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // 中心火柱
        const pillarGradient = ctx.createLinearGradient(x, y - 60 * scale, x, y + 60 * scale);
        pillarGradient.addColorStop(0, 'transparent');
        pillarGradient.addColorStop(0.3, `rgba(255, 200, 0, ${alpha})`);
        pillarGradient.addColorStop(0.5, `rgba(255, 107, 53, ${alpha})`);
        pillarGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = pillarGradient;
        ctx.fillRect(x - 30 * scale, y - 60 * scale, 60 * scale, 120 * scale);

        // 伤害数字（更大更醒目）
        ctx.fillStyle = '#FF4500';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.fillText(`🔥 ${effect.damage}`, x, y - 60 - progress * 30);
        ctx.shadowBlur = 0;

        // 命中数量
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`灼烧 ${effect.hitCount} 目标`, x, y - 30 - progress * 30);
    }

    // 圣光特效 - 增强版
    drawHolyEffect(ctx, x, y, color, progress, effect) {
        const alpha = 1 - progress;
        const scale = 1 + progress;

        // 屏幕圣光效果
        if (progress < 0.2) {
            const holyFlash = ctx.createRadialGradient(x, y, 0, x, y, 300);
            holyFlash.addColorStop(0, `rgba(255, 215, 0, ${0.3 * (1 - progress * 5)})`);
            holyFlash.addColorStop(1, 'transparent');
            ctx.fillStyle = holyFlash;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // 主光柱（更宽更亮）
        const pillarGradient = ctx.createLinearGradient(x - 50 * scale, y, x + 50 * scale, y);
        pillarGradient.addColorStop(0, 'transparent');
        pillarGradient.addColorStop(0.2, `rgba(255, 215, 0, ${alpha * 0.5})`);
        pillarGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
        pillarGradient.addColorStop(0.8, `rgba(255, 215, 0, ${alpha * 0.5})`);
        pillarGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = pillarGradient;
        ctx.fillRect(x - 50 * scale, y - 150, 100 * scale, 300);

        // 多层圣光射线
        for (let ring = 0; ring < 3; ring++) {
            const ringScale = 1 + ring * 0.5;
            ctx.strokeStyle = ring === 0 ? '#fff' : color;
            ctx.lineWidth = 3 - ring;
            ctx.globalAlpha = alpha * (1 - ring * 0.3);
            ctx.shadowColor = color;
            ctx.shadowBlur = 20 - ring * 5;

            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2 + progress * Math.PI * (ring + 1);
                const len = (50 + ring * 30) * ringScale + Math.sin(progress * Math.PI * 6) * 15;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + Math.cos(angle) * len,
                    y + Math.sin(angle) * len
                );
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;

        // 中心圣光球（多层）
        for (let i = 0; i < 3; i++) {
            const ballRadius = Math.max(0.1, (25 - i * 5) * scale * (1 - progress * 0.3));
            const ballGradient = ctx.createRadialGradient(x, y, 0, x, y, ballRadius);
            ballGradient.addColorStop(0, i === 0 ? '#fff' : color);
            ballGradient.addColorStop(0.5, color);
            ballGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = ballGradient;
            ctx.globalAlpha = alpha * (0.8 - i * 0.2);
            ctx.beginPath();
            ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 圣光粒子
        ctx.globalAlpha = alpha;
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + progress * 2;
            const dist = 60 + progress * 40;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist - progress * 30;

            ctx.fillStyle = i % 2 === 0 ? '#fff' : color;
            const particleRadius = Math.max(0.1, 3 * (1 - progress));
            ctx.beginPath();
            ctx.arc(px, py, particleRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 伤害数字（更大更醒目）
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF8C00';
        ctx.shadowBlur = 15;
        ctx.fillText(`✨ ${effect.damage}`, x, y - 70 - progress * 20);
        ctx.shadowBlur = 0;

        // 命中数量
        ctx.fillStyle = '#e3b341';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`审判 ${effect.hitCount} 目标`, x, y - 40 - progress * 20);
    }

    drawBattlefield() {
        const ctx = this.ctx;
        const layout = this.layout;
        const scene = this.sceneManager.getCurrentScene();
        const roadStyle = scene.road;

        // 绘制三条弧形路
        this.lanes.forEach((lane, index) => {
            // 绘制弧形道路（更宽的道路）
            ctx.strokeStyle = lane.color;
            ctx.lineWidth = 80;
            ctx.lineCap = 'round';
            ctx.globalAlpha = roadStyle.alpha;

            ctx.beginPath();
            ctx.moveTo(lane.playerX, layout.playerBase.y - 40);

            // 使用二次贝塞尔曲线绘制弧形
            const controlX = lane.playerX + (lane.enemyX - lane.playerX) * 0.5 + lane.curve * 150;
            const controlY = (layout.playerBase.y + layout.enemyBase.y) / 2;
            ctx.quadraticCurveTo(controlX, controlY, lane.enemyX, layout.enemyBase.y + 20);
            ctx.stroke();

            ctx.globalAlpha = 1;

            // 绘制道路中线
            ctx.strokeStyle = lane.color;
            ctx.lineWidth = 3;
            ctx.setLineDash(roadStyle.lineDash);
            ctx.globalAlpha = roadStyle.lineAlpha;

            ctx.beginPath();
            ctx.moveTo(lane.playerX, layout.playerBase.y - 40);
            ctx.quadraticCurveTo(controlX, controlY, lane.enemyX, layout.enemyBase.y + 20);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            // 绘制路名标签（在中间区域）
            const midX = (lane.playerX + lane.enemyX) / 2 + lane.curve * 30;
            const midY = (layout.playerBase.y + layout.enemyBase.y) / 2;
            ctx.fillStyle = lane.color;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = 0.6;
            ctx.fillText(lane.name, midX, midY);
            ctx.globalAlpha = 1;
        });

        // 绘制中央战斗区域标识
        const centerY = (layout.playerBase.y + layout.enemyBase.y) / 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(250, centerY - 60);
        ctx.lineTo(250, centerY + 60);
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制我方基地大门
        this.drawPlayerBase(ctx, layout, scene);

        // 绘制英雄区域
        this.drawHeroZone(ctx, layout, scene);

        // 绘制士兵屯兵区
        this.drawTroopZone(ctx, layout, scene);

        // 绘制敌方基地
        this.drawEnemyBase(ctx, layout, scene);

        // 绘制出兵台词
        this.drawQuotes(ctx);
    }

    // 绘制台词
    drawQuotes(ctx) {
        for (const quote of this.activeQuotes) {
            const alpha = Math.min(1, quote.life / 0.3); // 淡出效果
            const offsetY = (quote.maxLife - quote.life) * 20; // 向上飘动

            ctx.save();
            ctx.globalAlpha = alpha;

            // 台词背景
            ctx.font = 'bold 12px sans-serif';
            const textWidth = ctx.measureText(quote.text).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(quote.x - textWidth / 2 - 6, quote.y - offsetY - 14, textWidth + 12, 20, 4);
            ctx.fill();

            // 台词文字
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(quote.text, quote.x, quote.y - offsetY);

            ctx.restore();
        }
    }

    drawPlayerBase(ctx, layout, scene) {
        const y = layout.playerBase.y;
        const centerX = this.width / 2;
        const baseStyle = scene.base;

        // 大门背景（适应外扩布局）
        ctx.fillStyle = baseStyle.player;
        ctx.fillRect(30, y - 30, 440, 60);

        // 大门边框
        ctx.strokeStyle = baseStyle.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(30, y - 30, 440, 60);

        // 大门装饰
        ctx.strokeStyle = baseStyle.border;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 2;
        for (let i = 1; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(30 + i * 73, y - 30);
            ctx.lineTo(30 + i * 73, y + 30);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // 血条背景
        ctx.fillStyle = '#30363d';
        ctx.fillRect(60, y - 20, 380, 16);

        // 血条
        const hpPercent = this.playerBaseHP / this.playerBaseMaxHP;
        ctx.fillStyle = hpPercent > 0.5 ? '#238636' : hpPercent > 0.25 ? '#d29922' : '#da3633';
        ctx.fillRect(60, y - 20, 380 * hpPercent, 16);

        // 血量文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.playerBaseHP}/${this.playerBaseMaxHP}`, centerX, y - 8);

        // 基地标签
        ctx.fillStyle = baseStyle.border;
        ctx.font = '11px sans-serif';
        ctx.fillText('我方城门', centerX, y + 20);
    }

    drawHeroZone(ctx, layout, scene) {
        const y = layout.heroZone.y;
        const heroStyle = scene.hero;

        // 英雄站位区域背景（适应外扩布局）
        ctx.fillStyle = heroStyle.bg;
        ctx.fillRect(20, y - 35, 460, 70);

        // 区域边框
        ctx.strokeStyle = heroStyle.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, y - 35, 460, 70);

        // 绘制三个英雄
        this.lanes.forEach((lane, index) => {
            const x = lane.playerX;
            const hero = this.heroes[index];
            const skill = this.heroSkills[index];

            // 技能就绪时的光环效果
            if (hero.skillCD <= 0) {
                const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
                ctx.shadowColor = skill.color;
                ctx.shadowBlur = 20 * pulse;
                ctx.strokeStyle = skill.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6 * pulse;
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }

            // 英雄底座（发光）
            const baseGradient = ctx.createRadialGradient(x, y, 0, x, y, 28);
            // 解析 rgba 并调整透明度
            const borderColor = heroStyle.border;
            const baseColor0 = borderColor.replace(/[\d.]+%?\)$/, '0.25)');
            const baseColor1 = borderColor.replace(/[\d.]+%?\)$/, '0.06)');
            baseGradient.addColorStop(0, baseColor0);
            baseGradient.addColorStop(1, baseColor1);
            ctx.fillStyle = baseGradient;
            ctx.beginPath();
            ctx.arc(x, y, 28, 0, Math.PI * 2);
            ctx.fill();

            // 英雄主体（比士兵大）
            const heroGradient = ctx.createRadialGradient(x - 6, y - 6, 0, x, y, 20);
            heroGradient.addColorStop(0, '#fff');
            heroGradient.addColorStop(0.3, skill.color);
            heroGradient.addColorStop(1, heroStyle.color);
            ctx.fillStyle = heroGradient;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();

            // 英雄边框（根据技能状态变色）
            ctx.strokeStyle = hero.skillCD <= 0 ? skill.color : heroStyle.border;
            ctx.lineWidth = hero.skillCD <= 0 ? 4 : 3;
            ctx.shadowColor = skill.color;
            ctx.shadowBlur = hero.skillCD <= 0 ? 10 : 0;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 技能图标（小圆圈内）
            ctx.fillStyle = hero.skillCD <= 0 ? skill.color : '#666';
            ctx.beginPath();
            ctx.arc(x + 14, y - 14, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 技能首字
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(skill.name.charAt(0), x + 14, y - 11);

            // 英雄血条背景
            ctx.fillStyle = '#30363d';
            ctx.fillRect(x - 28, y - 36, 56, 8);

            // 英雄血条
            const hpPercent = hero.hp / hero.maxHp;
            const hpGradient = ctx.createLinearGradient(x - 28, y - 36, x + 28, y - 36);
            if (hpPercent > 0.5) {
                hpGradient.addColorStop(0, '#1a7f37');
                hpGradient.addColorStop(1, '#3fb950');
            } else if (hpPercent > 0.25) {
                hpGradient.addColorStop(0, '#9e6a03');
                hpGradient.addColorStop(1, '#d29922');
            } else {
                hpGradient.addColorStop(0, '#8b1519');
                hpGradient.addColorStop(1, '#da3633');
            }
            ctx.fillStyle = hpGradient;
            ctx.fillRect(x - 28, y - 36, 56 * hpPercent, 8);

            // 英雄等级（带背景）
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.arc(x, y + 18, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(`Lv${hero.level}`, x, y + 21);

            // 技能CD指示（更明显的环形）
            if (hero.skillCD > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.fill();

                // CD环形进度
                const cdPercent = hero.skillCD / skill.cooldown;
                ctx.strokeStyle = skill.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdPercent);
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(Math.ceil(hero.skillCD) + 's', x, y + 4);
            }

            // 路名标签
            ctx.fillStyle = lane.color;
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(lane.name, x, y + 34);
        });

        // 区域标签
        ctx.fillStyle = heroStyle.border;
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('★ 英雄', 25, y - 22);
        ctx.globalAlpha = 1;
    }

    drawTroopZone(ctx, layout, scene) {
        const y = layout.troopZone.y;
        const troopStyle = scene.troop;

        // 快捷键映射
        const keyLabels = ['Q', 'W', 'E'];

        // 士兵屯兵区背景
        ctx.fillStyle = troopStyle.bg;
        ctx.fillRect(20, y - 35, 460, 70);

        // 区域边框
        ctx.strokeStyle = troopStyle.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, y - 35, 460, 70);

        // 绘制三路屯兵
        this.lanes.forEach((lane, index) => {
            const x = lane.playerX;
            const troop = this.troops[index];
            const isHovered = this.hoveredTroopLane === index;
            const hasTroops = troop.count > 0;

            // 屯兵槽背景（悬停高亮）
            ctx.fillStyle = isHovered && hasTroops ? lane.color + '30' : '#21262d';
            ctx.fillRect(x - 45, y - 25, 90, 50);

            // 屯兵槽边框（悬停时加粗变亮）
            ctx.strokeStyle = isHovered && hasTroops ? lane.color : lane.color + '80';
            ctx.lineWidth = isHovered && hasTroops ? 3 : 2;
            ctx.strokeRect(x - 45, y - 25, 90, 50);

            // 没兵时灰显
            ctx.globalAlpha = hasTroops ? 1 : 0.4;

            // 兵种图标
            const iconColor = troop.type === 'sword' ? '#58a6ff' :
                             troop.type === 'spear' ? '#d29922' : '#a371f7';

            // 士兵小圆圈
            const count = Math.min(troop.count, 5);
            for (let i = 0; i < count; i++) {
                const offsetX = (i - 2) * 14;
                ctx.fillStyle = iconColor;
                ctx.beginPath();
                ctx.arc(x + offsetX, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            if (troop.count > 5) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`+${troop.count - 5}`, x + 35, y + 3);
            }

            // 数量
            ctx.fillStyle = '#c9d1d9';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${troop.count}`, x, y + 18);

            ctx.globalAlpha = 1;

            // 快捷键标签（左上角）
            const keyLabel = this.laneCount === 1 ? 'W' :
                             this.laneCount === 2 ? (index === 0 ? 'Q' : 'E') :
                             keyLabels[index];
            ctx.fillStyle = isHovered && hasTroops ? '#fff' : lane.color;
            ctx.font = `bold ${isHovered && hasTroops ? 13 : 11}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(`[${keyLabel}]`, x, y - 12);

            // 出兵提示（悬停时显示）
            if (isHovered && hasTroops) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.globalAlpha = 0.9;
                ctx.fillText('点击出兵', x, y - 28);
                ctx.globalAlpha = 1;
            }
        });

        // 区域标签
        ctx.fillStyle = troopStyle.border;
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('屯 兵', 25, y - 22);
        ctx.globalAlpha = 1;
    }

    drawEnemyBase(ctx, layout, scene) {
        const y = layout.enemyBase.y;
        const centerX = this.width / 2;
        const baseStyle = scene.base;

        // 敌方基地（适应外扩布局）
        ctx.fillStyle = baseStyle.enemy;
        ctx.fillRect(100, y - 20, 300, 40);

        // 边框
        ctx.strokeStyle = baseStyle.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(100, y - 20, 300, 40);

        // 血条背景
        ctx.fillStyle = '#30363d';
        ctx.fillRect(120, y - 10, 260, 10);

        // 血条
        const hpPercent = this.enemyBaseHP / this.enemyBaseMaxHP;
        ctx.fillStyle = hpPercent > 0.5 ? '#da3633' : hpPercent > 0.25 ? '#d29922' : '#f85149';
        ctx.fillRect(120, y - 10, 260 * hpPercent, 10);

        // 标签
        ctx.fillStyle = baseStyle.border;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('敌方据点', centerX, y + 12);
    }

    drawUI() {
        // FPS和单位数由HTML UI显示
        document.getElementById('fps').textContent = this.fps;
        document.getElementById('unitCount').textContent = this.entities.length;

        // 绘制士气条
        this.drawMoraleBar();
    }

    // 绘制士气条
    drawMoraleBar() {
        const ctx = this.ctx;
        const barWidth = 240;
        const barHeight = 16;
        const x = (this.width - barWidth) / 2;
        const y = 8;

        // 外框发光效果（根据士气差异）
        const moraleDiff = this.morale.player - this.morale.enemy;
        if (Math.abs(moraleDiff) > 20) {
            const glowColor = moraleDiff > 0 ? 'rgba(35, 134, 54, 0.5)' : 'rgba(218, 54, 51, 0.5)';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
        }

        // 背景
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.shadowBlur = 0;

        // 边框
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // 计算士气比例 (50-200范围映射到0-1)
        const playerRatio = Math.max(0, Math.min(1, (this.morale.player - 50) / 150));
        const enemyRatio = Math.max(0, Math.min(1, (this.morale.enemy - 50) / 150));

        // 玩家士气（左半边）- 渐变效果
        const playerWidth = (barWidth / 2) * playerRatio;
        const playerGradient = ctx.createLinearGradient(x, y, x + barWidth/2, y);
        if (playerRatio > 0.7) {
            playerGradient.addColorStop(0, '#1a7f37');
            playerGradient.addColorStop(1, '#2ea043');
        } else if (playerRatio > 0.3) {
            playerGradient.addColorStop(0, '#9e6a03');
            playerGradient.addColorStop(1, '#d29922');
        } else {
            playerGradient.addColorStop(0, '#8b1519');
            playerGradient.addColorStop(1, '#da3633');
        }
        ctx.fillStyle = playerGradient;
        ctx.fillRect(x + barWidth / 2 - playerWidth, y, playerWidth, barHeight);

        // 敌方士气（右半边）- 渐变效果
        const enemyWidth = (barWidth / 2) * enemyRatio;
        const enemyGradient = ctx.createLinearGradient(x + barWidth/2, y, x + barWidth, y);
        if (enemyRatio > 0.7) {
            enemyGradient.addColorStop(0, '#da3633');
            enemyGradient.addColorStop(1, '#ff6b6b');
        } else if (enemyRatio > 0.3) {
            enemyGradient.addColorStop(0, '#d29922');
            enemyGradient.addColorStop(1, '#e3b341');
        } else {
            enemyGradient.addColorStop(0, '#2ea043');
            enemyGradient.addColorStop(1, '#3fb950');
        }
        ctx.fillStyle = enemyGradient;
        ctx.fillRect(x + barWidth / 2, y, enemyWidth, barHeight);

        // 中心分隔线（加粗）
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, y - 2);
        ctx.lineTo(x + barWidth / 2, y + barHeight + 2);
        ctx.stroke();

        // 士气数值（带背景）
        this.drawMoraleNumber(ctx, Math.round(this.morale.player), x + barWidth / 2 - 35, y + 8, this.morale.player);
        this.drawMoraleNumber(ctx, Math.round(this.morale.enemy), x + barWidth / 2 + 35, y + 8, this.morale.enemy);

        // 标签
        ctx.fillStyle = '#8b949e';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('士 气', x + barWidth / 2, y + barHeight + 14);

        // 战损统计（带图标）
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#58a6ff';
        ctx.fillText(`💀 ${this.casualties.player}`, x - 45, y + 12);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f85149';
        ctx.fillText(`💀 ${this.casualties.enemy}`, x + barWidth + 45, y + 12);

        // 士气优势指示
        if (Math.abs(moraleDiff) > 30) {
            const advantageText = moraleDiff > 0 ? '▲ 优势' : '▼ 劣势';
            ctx.fillStyle = moraleDiff > 0 ? '#2ea043' : '#da3633';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(advantageText, x + barWidth / 2, y - 6);
        }
    }

    // 绘制士气数值（带颜色背景）
    drawMoraleNumber(ctx, value, x, y, morale) {
        // 背景圆
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        if (morale > 130) {
            ctx.fillStyle = 'rgba(35, 134, 54, 0.8)';
        } else if (morale < 70) {
            ctx.fillStyle = 'rgba(218, 54, 51, 0.8)';
        } else {
            ctx.fillStyle = 'rgba(139, 148, 158, 0.5)';
        }
        ctx.fill();

        // 数值
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, x, y + 1);
        ctx.textBaseline = 'alphabetic';
    }

    // 获取某条路在指定Y坐标的X位置（用于弧形移动）
    getLaneXAtY(laneIndex, y) {
        const lane = this.lanes[laneIndex];
        const layout = this.layout;

        // 计算在路径上的比例位置 (0 = 敌方, 1 = 我方)
        const t = (layout.playerBase.y - y) / (layout.playerBase.y - layout.enemyBase.y);
        const clampedT = Math.max(0, Math.min(1, t));

        // 二次贝塞尔曲线插值（使用更大的弯曲系数）
        const controlX = lane.playerX + (lane.enemyX - lane.playerX) * 0.5 + lane.curve * 150;
        const oneMinusT = 1 - clampedT;

        // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
        return oneMinusT * oneMinusT * lane.playerX +
               2 * oneMinusT * clampedT * controlX +
               clampedT * clampedT * lane.enemyX;
    }

    spawnUnit(laneIndex, team, unitType = 'melee') {
        const entity = this.entityPool.acquire();
        const lane = this.lanes[laneIndex];

        entity.lane = laneIndex;
        entity.team = team;
        entity.unitType = unitType;

        // 根据兵种设置属性
        switch(unitType) {
            case 'ranged':
                entity.radius = 10;
                entity.hp = 80;
                entity.maxHp = 80;
                entity.attack = 15;
                entity.attackRange = 80;
                entity.speed = 110 * lane.speedMod;
                break;
            case 'tank':
                entity.radius = 14;
                entity.hp = 200;
                entity.maxHp = 200;
                entity.attack = 8;
                entity.attackRange = 25;
                entity.speed = 70 * lane.speedMod;
                break;
            default: // melee
                entity.radius = 12;
                entity.hp = 100;
                entity.maxHp = 100;
                entity.attack = 12;
                entity.attackRange = 30;
                entity.speed = 100 * lane.speedMod;
        }

        if (team === 0) {
            // 玩家方 - 从屯兵区出发向上
            entity.position.set(lane.playerX, this.layout.troopZone.y);
            entity.velocity.set(0, -entity.speed);
            entity.color = '#2ea043';

            // 减少屯兵数量
            if (this.troops[laneIndex].count > 0) {
                this.troops[laneIndex].count--;
            }
        } else {
            // 敌方 - 从上方出发向下
            entity.position.set(lane.enemyX, this.layout.enemyBase.y);
            entity.velocity.set(0, entity.speed);
            entity.color = '#f85149';
        }

        this.entities.push(entity);

        // 玩家方出兵时显示台词
        if (team === 0) {
            this.showSpawnQuote(entity, unitType);
        }

        return entity;
    }

    // 显示出兵台词
    showSpawnQuote(entity, unitType) {
        const quotes = this.spawnQuotes[unitType] || this.spawnQuotes.melee;
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        this.activeQuotes.push({
            text: quote,
            x: entity.position.x,
            y: entity.position.y - 30,
            life: 1.5,  // 显示1.5秒
            maxLife: 1.5,
            entity: entity  // 跟随实体
        });
    }

    // 增加屯兵
    addTroop(laneIndex, amount = 1) {
        if (this.troops[laneIndex]) {
            this.troops[laneIndex].count += amount;
        }
    }

    // 更新士气
    updateMorale() {
        const totalCasualties = this.casualties.player + this.casualties.enemy;
        if (totalCasualties === 0) return;

        // 计算战损比例
        const playerCasualtyRate = this.casualties.player / (totalCasualties + 10); // +10 避免除零和早期波动
        const enemyCasualtyRate = this.casualties.enemy / (totalCasualties + 10);

        // 士气基于相对战损表现 (基准100，范围0-200)
        // 战损少的一方士气高，战损多的一方士气低
        const casualtyDiff = enemyCasualtyRate - playerCasualtyRate; // 正值表示玩家战损少，士气应高

        this.morale.player = Math.max(50, Math.min(200, 100 + casualtyDiff * 200));
        this.morale.enemy = Math.max(50, Math.min(200, 100 - casualtyDiff * 200));
    }

    // 获取士气伤害加成
    getMoraleDamageBonus(team) {
        const morale = team === 0 ? this.morale.player : this.morale.enemy;
        // 士气100为基准，每点士气差异提供0.5%伤害加成/减成
        // 士气50时伤害75%，士气200时伤害150%
        return morale / 100;
    }

    // 切换路数
    setLaneCount(count) {
        if (count < 1 || count > 3) return false;
        if (count === this.laneCount) return true;

        this.laneCount = count;
        this.lanes = this.laneConfigs[count];

        // 清理当前实体
        for (const entity of this.entities) {
            entity.active = false;
        }

        // 重置屯兵和英雄状态
        this.troops = {};
        this.heroes = {};
        for (let i = 0; i < count; i++) {
            this.troops[i] = { count: 3, type: 'sword', level: 1 };
            this.heroes[i] = { hp: 500, maxHp: 500, level: 1, skillCD: 0 };
        }

        return true;
    }
}
// Last modified: 2026年 3月19日 星期四 10时27分46秒 CST
console.log('Game.js loaded - v1773887266');
// Debug version: 1773892619
