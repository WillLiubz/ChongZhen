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

        // 基地血量
        this.playerBaseHP = 1000;
        this.playerBaseMaxHP = 1000;
        this.enemyBaseHP = 1000;
        this.enemyBaseMaxHP = 1000;

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

        this.init();
    }

    init() {
        // 初始化对象池
        this.entityPool = new ObjectPool(
            () => new Entity(this.nextEntityId++),
            (entity) => entity.reset(),
            50
        );
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
        // 移动系统
        this.moveSystem.update(this.entities, this.deltaTime);

        // 碰撞检测
        this.collisionSystem.update(this.entities);

        // 清理死亡实体
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (!entity.active) {
                this.entityPool.release(entity);
                this.entities.splice(i, 1);
            }
        }

        // 更新技能CD
        for (let i = 0; i < this.laneCount; i++) {
            if (this.heroes[i] && this.heroes[i].skillCD > 0) {
                this.heroes[i].skillCD -= this.deltaTime;
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

        // 绘制UI
        this.drawUI();
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

            // 英雄底座
            ctx.fillStyle = heroStyle.border;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // 英雄主体（比士兵大）
            ctx.fillStyle = heroStyle.color;
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fill();

            // 英雄边框
            ctx.strokeStyle = heroStyle.border;
            ctx.lineWidth = 3;
            ctx.stroke();

            // 英雄血条背景
            ctx.fillStyle = '#30363d';
            ctx.fillRect(x - 25, y - 32, 50, 6);

            // 英雄血条
            const hero = this.heroes[index];
            const hpPercent = hero.hp / hero.maxHp;
            ctx.fillStyle = hpPercent > 0.5 ? '#238636' : hpPercent > 0.25 ? '#d29922' : '#da3633';
            ctx.fillRect(x - 25, y - 32, 50 * hpPercent, 6);

            // 英雄等级
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Lv${hero.level}`, x, y + 4);

            // 技能CD指示
            if (hero.skillCD > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.fillText(Math.ceil(hero.skillCD) + 's', x, y + 4);
            }

            // 路名标签
            ctx.fillStyle = lane.color;
            ctx.font = '11px sans-serif';
            ctx.fillText(lane.name, x, y + 32);
        });

        // 区域标签
        ctx.fillStyle = heroStyle.border;
        ctx.globalAlpha = 0.8;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('英雄', 25, y - 22);
        ctx.globalAlpha = 1;
    }

    drawTroopZone(ctx, layout, scene) {
        const y = layout.troopZone.y;
        const troopStyle = scene.troop;

        // 士兵屯兵区背景（适应外扩布局）
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

            // 屯兵槽背景
            ctx.fillStyle = '#21262d';
            ctx.fillRect(x - 45, y - 25, 90, 50);

            // 屯兵槽边框
            ctx.strokeStyle = lane.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 45, y - 25, 90, 50);

            // 兵种图标（简化为圆形）
            const iconColor = troop.type === 'sword' ? '#58a6ff' :
                             troop.type === 'spear' ? '#d29922' : '#a371f7';

            // 显示多个士兵缩略图表示数量
            const count = Math.min(troop.count, 5);
            for (let i = 0; i < count; i++) {
                const offsetX = (i - 2) * 14;
                ctx.fillStyle = iconColor;
                ctx.beginPath();
                ctx.arc(x + offsetX, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // 如果数量超过5，显示+号
            if (troop.count > 5) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`+${troop.count - 5}`, x + 35, y + 3);
            }

            // 数量显示
            ctx.fillStyle = '#c9d1d9';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${troop.count}`, x, y + 18);

            // 等级标识
            ctx.fillStyle = '#8b949e';
            ctx.font = '9px sans-serif';
            ctx.fillText(`Lv${troop.level}`, x, y - 12);
        });

        // 区域标签
        ctx.fillStyle = troopStyle.border;
        ctx.globalAlpha = 0.8;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('屯兵', 25, y - 22);
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
        return entity;
    }

    // 增加屯兵
    addTroop(laneIndex, amount = 1) {
        if (this.troops[laneIndex]) {
            this.troops[laneIndex].count += amount;
        }
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
