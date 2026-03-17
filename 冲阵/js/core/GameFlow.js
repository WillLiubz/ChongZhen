/**
 * 游戏流程管理器
 * 管理出身选择 -> 世界地图 -> 战斗 的流程
 */
class GameFlow {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // 当前阶段: 'origin' | 'worldmap' | 'battle'
        this.currentStage = 'origin';

        // 玩家选择
        this.playerOrigin = null; // 'plains' | 'ocean' | 'space' | 'grassland'

        // 世界地图数据
        this.worldMap = new WorldMap(this);

        // 出身选项配置
        this.originOptions = [
            {
                id: 'plains',
                name: '山丘领主',
                subtitle: '高地守护者',
                description: '你出生在大陆中心的连绵丘陵，\n这里地势险要，易守难攻。',
                scene: 'land',
                color: '#8B7355',
                icon: '⛰️',
                x: 250, y: 200
            },
            {
                id: 'ocean',
                name: '深海行者',
                subtitle: '深渊探索者',
                description: '你在海底深渊的水晶宫殿中苏醒，\n海洋的力量在你血脉中流淌。',
                scene: 'ocean',
                color: '#0066CC',
                icon: '🌊',
                x: 250, y: 320
            },
            {
                id: 'space',
                name: '星际旅者',
                subtitle: '虚空漫步者',
                description: '你来自漂浮在星云中的太空站，\n星辰是你的征途。',
                scene: 'space',
                color: '#9933FF',
                icon: '🚀',
                x: 250, y: 440
            },
            {
                id: 'grassland',
                name: '草原之魂',
                subtitle: '风之骑手',
                description: '你在无边无际的草原上长大，\n自由的风指引你的方向。',
                scene: 'grassland',
                color: '#44AA44',
                icon: '🌿',
                x: 250, y: 560
            }
        ];

        // 动画状态
        this.animationTime = 0;
        this.hoveredOption = null;
        this.selectedOption = null;

        // 绑定点击事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // 开始动画循环
        this.animate();
    }

    // 处理鼠标移动
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentStage === 'origin') {
            this.hoveredOption = null;
            for (const option of this.originOptions) {
                if (this.isPointInOption(x, y, option)) {
                    this.hoveredOption = option.id;
                    this.canvas.style.cursor = 'pointer';
                    return;
                }
            }
            this.canvas.style.cursor = 'default';
        } else if (this.currentStage === 'worldmap') {
            this.worldMap.handleMouseMove(x, y);
        }
    }

    // 处理点击
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentStage === 'origin') {
            for (const option of this.originOptions) {
                if (this.isPointInOption(x, y, option)) {
                    this.selectOrigin(option);
                    return;
                }
            }
        } else if (this.currentStage === 'worldmap') {
            this.worldMap.handleClick(x, y);
        }
    }

    // 检测点击是否在选项内
    isPointInOption(x, y, option) {
        const width = 400;
        const height = 100;
        return x >= option.x - width/2 && x <= option.x + width/2 &&
               y >= option.y - height/2 && y <= option.y + height/2;
    }

    // 选择出身
    selectOrigin(option) {
        this.selectedOption = option.id;
        this.playerOrigin = option.id;

        // 延迟后进入世界地图
        setTimeout(() => {
            this.currentStage = 'worldmap';
            this.worldMap.init(this.playerOrigin);
        }, 500);
    }

    // 开始战斗
    startBattle(sceneType) {
        this.currentStage = 'battle';

        // 触发游戏开始回调
        if (this.onBattleStart) {
            this.onBattleStart(sceneType);
        }
    }

    // 动画循环
    animate() {
        if (this.currentStage === 'battle') return; // 战斗阶段由Game接管

        this.animationTime += 0.016;
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.currentStage === 'origin') {
            this.renderOriginSelect();
        } else if (this.currentStage === 'worldmap') {
            this.worldMap.render(this.ctx, this.animationTime);
        }

        requestAnimationFrame(() => this.animate());
    }

    // 渲染出身选择画面
    renderOriginSelect() {
        const ctx = this.ctx;

        // 背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a1a3a');
        gradient.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('选择你的出身', this.width/2, 80);

        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.fillText('你的选择将决定你战斗的世界', this.width/2, 110);

        // 渲染每个选项
        for (const option of this.originOptions) {
            this.renderOriginOption(option);
        }
    }

    // 渲染单个出身选项
    renderOriginOption(option) {
        const ctx = this.ctx;
        const isHovered = this.hoveredOption === option.id;
        const isSelected = this.selectedOption === option.id;

        const width = 400;
        const height = 100;
        const x = option.x - width/2;
        const y = option.y - height/2;

        // 动画缩放
        let scale = 1;
        if (isHovered) scale = 1.02;
        if (isSelected) scale = 0.98;

        ctx.save();
        ctx.translate(option.x, option.y);
        ctx.scale(scale, scale);
        ctx.translate(-option.x, -option.y);

        // 卡片背景
        const cardGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        cardGradient.addColorStop(0, 'rgba(30, 30, 50, 0.9)');
        cardGradient.addColorStop(1, 'rgba(20, 20, 40, 0.9)');
        ctx.fillStyle = cardGradient;

        // 边框发光效果
        if (isHovered || isSelected) {
            ctx.shadowColor = option.color;
            ctx.shadowBlur = 20;
        }

        // 绘制圆角矩形
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 12);
        ctx.fill();

        // 边框
        ctx.strokeStyle = isHovered || isSelected ? option.color : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isHovered || isSelected ? 3 : 1;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // 图标
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(option.icon, x + 20, y + 65);

        // 名称
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(option.name, x + 80, y + 40);

        // 副标题
        ctx.fillStyle = option.color;
        ctx.font = '12px sans-serif';
        ctx.fillText(option.subtitle, x + 80, y + 60);

        // 描述（多行）
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        const lines = option.description.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, x + 80, y + 80 + i * 14);
        });

        ctx.restore();
    }
}

/**
 * 球形世界地图类
 * 中央有宝藏，玩家需要挑战格子上的怪物来占领
 */
class WorldMap {
    constructor(gameFlow) {
        this.gameFlow = gameFlow;
        this.width = 500;
        this.height = 800;

        // 地图配置 - 球形布局
        this.centerX = this.width / 2;
        this.centerY = this.height / 2 - 50;
        this.sphereRadius = 280;

        // 网格配置
        this.ringCount = 5; // 环形层数
        this.gridSize = 45;

        // 中央宝藏
        this.treasure = {
            x: this.centerX,
            y: this.centerY,
            radius: 35,
            conquered: false
        };

        // 四个出生点配置（在球形边缘）
        this.spawnPoints = {
            plains: { angle: -135, color: '#8B7355', icon: '⛰️', name: '山丘领主' },      // 左上
            ocean: { angle: -45, color: '#0066CC', icon: '🌊', name: '深海行者' },       // 右上
            space: { angle: 135, color: '#9933FF', icon: '🚀', name: '星际旅者' },       // 左下
            grassland: { angle: 45, color: '#44AA44', icon: '🌿', name: '草原之魂' }     // 右下
        };

        // 玩家位置（在球形上的坐标）
        this.playerOrigin = null;
        this.playerPos = null; // { ring: 0-4, angle: 角度 }

        // 格子数据 - 每个格子的占领状态和怪物
        this.cells = []; // 二维数组 [ring][cellIndex]

        // 可见范围（环形层数）
        this.visibilityRange = 1;

        // 悬停的格子
        this.hoveredCell = null;

        // 动画
        this.sphereRotation = 0;
    }

    // 初始化地图
    init(playerOrigin) {
        this.playerOrigin = playerOrigin;

        // 玩家出生在第4环（距离宝藏8格以外）
        const spawnPoint = this.spawnPoints[playerOrigin];
        this.playerPos = {
            ring: 4,
            angle: spawnPoint.angle
        };

        // 初始化球形网格
        this.initSphereGrid();

        // 生成怪物
        this.generateMonsters();
    }

    // 初始化球形网格
    initSphereGrid() {
        this.cells = [];

        for (let ring = 0; ring < this.ringCount; ring++) {
            this.cells[ring] = [];
            const cellCount = 8 + ring * 4; // 内圈8格，每外圈多4格

            for (let i = 0; i < cellCount; i++) {
                const angle = (360 / cellCount) * i;
                const radius = (ring + 1) * (this.sphereRadius / this.ringCount);

                this.cells[ring][i] = {
                    ring: ring,
                    index: i,
                    angle: angle,
                    radius: radius,
                    x: this.centerX + Math.cos((angle - 90) * Math.PI / 180) * radius,
                    y: this.centerY + Math.sin((angle - 90) * Math.PI / 180) * radius,
                    conquered: false,
                    monster: null,
                    visible: false
                };
            }
        }

        this.updateVisibility();
    }

    // 更新可见区域
    updateVisibility() {
        // 找到玩家所在的格子
        let playerCell = null;
        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                // 检查是否是玩家位置附近的格子
                const angleDiff = Math.abs(cell.angle - this.playerPos.angle);
                const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

                if (cell.ring === this.playerPos.ring && normalizedDiff < 30) {
                    playerCell = cell;
                }
            }
        }

        // 更新可见性
        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                cell.visible = false;

                if (!playerCell) continue;

                // 同环或相邻环
                const ringDiff = Math.abs(cell.ring - playerCell.ring);
                if (ringDiff > this.visibilityRange) continue;

                // 角度接近
                const angleDiff = Math.abs(cell.angle - playerCell.angle);
                const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

                // 可见角度范围根据环数调整
                const visibleAngle = 45 + ringDiff * 15;
                if (normalizedDiff <= visibleAngle) {
                    cell.visible = true;
                }
            }
        }
    }

    // 生成怪物
    generateMonsters() {
        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                // 每个未占领的格子都有怪物
                if (!cell.conquered) {
                    const difficulty = ring + 1; // 越外层怪物越强
                    cell.monster = {
                        type: Math.random() > 0.6 ? 'ranged' : 'melee',
                        hp: 50 + difficulty * 25,
                        maxHp: 50 + difficulty * 25,
                        level: difficulty
                    };
                }
            }
        }
    }

    // 处理鼠标移动
    handleMouseMove(x, y) {
        this.hoveredCell = null;

        // 检查是否悬停在格子上
        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                if (!cell.visible) continue;

                const dist = Math.sqrt(
                    Math.pow(x - cell.x, 2) +
                    Math.pow(y - cell.y, 2)
                );

                if (dist < this.gridSize / 2) {
                    this.hoveredCell = cell;
                    this.gameFlow.canvas.style.cursor = cell.monster ? 'pointer' : 'default';
                    return;
                }
            }
        }

        this.gameFlow.canvas.style.cursor = 'default';
    }

    // 处理点击
    handleClick(x, y) {
        if (!this.hoveredCell) return;
        if (!this.hoveredCell.visible) return;

        // 点击有怪物的格子进入战斗
        if (this.hoveredCell.monster) {
            this.startBattleWithMonster(this.hoveredCell);
        }
    }

    // 与小怪战斗
    startBattleWithMonster(cell) {
        const sceneMap = {
            plains: 'land',
            ocean: 'ocean',
            space: 'space',
            grassland: 'grassland'
        };

        // 保存当前战斗的格子，胜利后可以占领
        this.currentBattleCell = cell;

        // 调用 GameFlow 的 startBattle 方法
        this.gameFlow.startBattle(sceneMap[this.playerOrigin]);
    }

    // 占领格子（战斗胜利后调用）
    conquerCell(cell) {
        cell.conquered = true;
        cell.monster = null;

        // 检查是否占领了宝藏周围的所有格子
        this.checkTreasureAccess();
    }

    // 检查是否可以占领宝藏
    checkTreasureAccess() {
        // 内圈所有格子都被占领时，可以挑战宝藏
        const innerRingConquered = this.cells[0].every(cell => cell.conquered);
        if (innerRingConquered) {
            this.treasure.conquered = true;
        }
    }

    // 渲染地图
    render(ctx, animationTime) {
        // 背景 - 深空效果
        const bgGradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.sphereRadius * 1.5
        );
        bgGradient.addColorStop(0, '#1a1a3a');
        bgGradient.addColorStop(0.7, '#0d0d1a');
        bgGradient.addColorStop(1, '#050510');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // 绘制球形轮廓
        this.drawSphereOutline(ctx, animationTime);

        // 绘制环形连接线
        this.drawRingConnections(ctx);

        // 绘制其他出生点（在球形远端）
        for (const [origin, data] of Object.entries(this.spawnPoints)) {
            if (origin !== this.playerOrigin) {
                this.renderDistantSpawnPoint(ctx, origin, data, animationTime);
            }
        }

        // 绘制格子
        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                this.renderCell(ctx, cell, animationTime);
            }
        }

        // 绘制中央宝藏
        this.renderTreasure(ctx, animationTime);

        // 绘制玩家
        this.renderPlayer(ctx, animationTime);

        // 绘制UI
        this.renderUI(ctx);
    }

    // 绘制球形轮廓
    drawSphereOutline(ctx, animationTime) {
        // 外圈光环
        const pulse = Math.sin(animationTime * 2) * 5;

        ctx.save();

        // 主球体轮廓
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.sphereRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 内圈光环
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.sphereRadius + 10 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 绘制同心圆环
        for (let i = 1; i <= this.ringCount; i++) {
            const radius = (i / this.ringCount) * this.sphereRadius;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100, 100, 150, ${0.1 - i * 0.015})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }

    // 绘制环形连接线
    drawRingConnections(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.08)';
        ctx.lineWidth = 1;

        for (let ring = 0; ring < this.ringCount; ring++) {
            if (!this.cells[ring]) continue;

            for (let i = 0; i < this.cells[ring].length; i++) {
                const cell = this.cells[ring][i];
                const nextCell = this.cells[ring][(i + 1) % this.cells[ring].length];

                ctx.beginPath();
                ctx.moveTo(cell.x, cell.y);
                ctx.lineTo(nextCell.x, nextCell.y);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // 渲染格子
    renderCell(ctx, cell, animationTime) {
        const isHovered = this.hoveredCell === cell;

        if (cell.visible) {
            // 可见格子
            ctx.save();

            // 格子背景 - 根据环数变化颜色
            const ringColors = ['#2a2a4a', '#252545', '#202040', '#1a1a3a', '#151535'];
            ctx.fillStyle = cell.conquered ? '#3a3a5a' : ringColors[cell.ring];

            if (isHovered) {
                ctx.fillStyle = '#4a4a6a';
            }

            // 绘制六边形格子
            this.drawHexagon(ctx, cell.x, cell.y, this.gridSize / 2 - 2);
            ctx.fill();

            // 边框
            ctx.strokeStyle = cell.conquered ? '#5a5a7a' : 'rgba(100,100,150,0.3)';
            ctx.lineWidth = isHovered ? 2 : 1;
            this.drawHexagon(ctx, cell.x, cell.y, this.gridSize / 2 - 2);
            ctx.stroke();

            // 绘制怪物
            if (cell.monster) {
                this.renderCellMonster(ctx, cell, animationTime);
            }

            // 已占领标记
            if (cell.conquered) {
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#44aa44';
                ctx.fillText('✓', cell.x, cell.y + 4);
            }

            ctx.restore();
        } else {
            // 迷雾中的格子 - 只绘制微弱轮廓
            ctx.save();
            ctx.strokeStyle = 'rgba(100,100,150,0.05)';
            ctx.lineWidth = 1;
            this.drawHexagon(ctx, cell.x, cell.y, this.gridSize / 2 - 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // 绘制六边形
    drawHexagon(ctx, x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (60 * i - 30) * Math.PI / 180;
            const hx = x + radius * Math.cos(angle);
            const hy = y + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hx, hy);
            } else {
                ctx.lineTo(hx, hy);
            }
        }
        ctx.closePath();
    }

    // 渲染格子上的怪物
    renderCellMonster(ctx, cell, animationTime) {
        const isHovered = this.hoveredCell === cell;
        const breathe = Math.sin(animationTime * 3 + cell.ring) * 2;

        ctx.save();
        ctx.translate(cell.x, cell.y);

        // 悬停光圈
        if (isHovered) {
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 怪物图标
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        const monsterIcons = { melee: '👹', ranged: '👺', tank: '👾' };
        ctx.fillText(monsterIcons[cell.monster.type] || '👹', 0, 6 + breathe);

        // 等级标记
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffaa44';
        ctx.fillText(`Lv${cell.monster.level}`, 0, -12);

        ctx.restore();
    }

    // 渲染中央宝藏
    renderTreasure(ctx, animationTime) {
        const pulse = Math.sin(animationTime * 3) * 8;
        const rotate = animationTime * 30;

        ctx.save();
        ctx.translate(this.treasure.x, this.treasure.y);

        // 外圈光环
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, this.treasure.radius + pulse);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.treasure.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 旋转的星形
        ctx.rotate(rotate * Math.PI / 180);
        ctx.fillStyle = '#FFD700';
        this.drawStar(ctx, 0, 0, 5, this.treasure.radius - 5, this.treasure.radius - 15);
        ctx.fill();

        ctx.rotate(-rotate * Math.PI / 180);

        // 宝藏图标
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💎', 0, 10);

        // 标签
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('中央宝藏', 0, 35);

        ctx.restore();
    }

    // 绘制星形
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }

    // 渲染远处的出生点（在球形边缘）
    renderDistantSpawnPoint(ctx, origin, data, animationTime) {
        const radius = this.sphereRadius + 40;
        const x = this.centerX + Math.cos((data.angle - 90) * Math.PI / 180) * radius;
        const y = this.centerY + Math.sin((data.angle - 90) * Math.PI / 180) * radius;

        const breathe = Math.sin(animationTime * 2 + data.angle) * 0.2 + 0.8;
        const alpha = 0.6 * breathe;

        ctx.save();
        ctx.globalAlpha = alpha;

        // 光晕
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
        glowGradient.addColorStop(0, data.color + '60');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 50, 0, Math.PI * 2);
        ctx.fill();

        // 图标背景
        ctx.fillStyle = data.color + '40';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();

        // 边框
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();

        // 图标
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(data.icon, x, y + 8);

        // 名称
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = data.color;
        ctx.fillText('???', x, y - 32);

        // 连接线到球体
        ctx.strokeStyle = data.color + '40';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        const innerX = this.centerX + Math.cos((data.angle - 90) * Math.PI / 180) * this.sphereRadius;
        const innerY = this.centerY + Math.sin((data.angle - 90) * Math.PI / 180) * this.sphereRadius;
        ctx.lineTo(innerX, innerY);
        ctx.stroke();

        ctx.restore();
    }

    // 渲染玩家
    renderPlayer(ctx, animationTime) {
        // 找到玩家对应的格子位置
        let playerX, playerY;

        // 在边缘环上找到对应角度的格子
        const ring = this.playerPos.ring;
        const targetAngle = this.playerPos.angle;

        if (this.cells[ring]) {
            let closestCell = null;
            let minAngleDiff = Infinity;

            for (let cell of this.cells[ring]) {
                let angleDiff = Math.abs(cell.angle - targetAngle);
                angleDiff = Math.min(angleDiff, 360 - angleDiff);
                if (angleDiff < minAngleDiff) {
                    minAngleDiff = angleDiff;
                    closestCell = cell;
                }
            }

            if (closestCell) {
                playerX = closestCell.x;
                playerY = closestCell.y;
            } else {
                // 备用计算
                const radius = (ring + 1) * (this.sphereRadius / this.ringCount);
                playerX = this.centerX + Math.cos((targetAngle - 90) * Math.PI / 180) * radius;
                playerY = this.centerY + Math.sin((targetAngle - 90) * Math.PI / 180) * radius;
            }
        } else {
            playerX = this.centerX;
            playerY = this.centerY;
        }

        const pulse = Math.sin(animationTime * 4) * 5;

        ctx.save();
        ctx.translate(playerX, playerY);

        // 光环
        ctx.beginPath();
        ctx.arc(0, 0, 25 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 玩家图标
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧙', 0, 9);

        ctx.restore();
    }

    // 渲染UI
    renderUI(ctx) {
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('世界地图', this.width/2, 30);

        // 当前位置
        const originNames = {
            plains: '丘陵领地',
            ocean: '深海领域',
            space: '太空站',
            grassland: '草原部落'
        };

        ctx.fillStyle = '#888';
        ctx.font = '12px sans-serif';
        ctx.fillText(`当前位置: ${originNames[this.playerOrigin]}`, this.width/2, 50);

        // 提示
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.fillText('点击周围的小怪开始战斗', this.width/2, this.height - 20);
    }
}
