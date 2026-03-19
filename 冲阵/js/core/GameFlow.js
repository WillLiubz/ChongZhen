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
        this.playerOrigin = null;

        // 世界地图数据
        this.worldMap = new WorldMap(this);

        // 出身选项配置 - 2x2圆形布局
        this.originOptions = [
            {
                id: 'plains',
                name: '山丘领主',
                subtitle: '高地守护者',
                description: '大陆中心的连绵丘陵',
                scene: 'land',
                color: '#8B7355',
                icon: '⛰️',
                avatar: '🧙‍♂️',
                x: 150, y: 280,
                radius: 55
            },
            {
                id: 'ocean',
                name: '深海行者',
                subtitle: '深渊探索者',
                description: '海底深渊的水晶宫殿',
                scene: 'ocean',
                color: '#0066CC',
                icon: '🌊',
                avatar: '🧜‍♂️',
                x: 350, y: 280,
                radius: 55
            },
            {
                id: 'space',
                name: '星际旅者',
                subtitle: '虚空漫步者',
                description: '漂浮在星云中的太空站',
                scene: 'space',
                color: '#9933FF',
                icon: '🚀',
                avatar: '👨‍🚀',
                x: 150, y: 480,
                radius: 55
            },
            {
                id: 'grassland',
                name: '草原之魂',
                subtitle: '风之骑手',
                description: '无边无际的草原',
                scene: 'grassland',
                color: '#44AA44',
                icon: '🌿',
                avatar: '🏇',
                x: 350, y: 480,
                radius: 55
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
            // 先更新 hoveredCell，确保点击时能找到格子
            this.worldMap.handleMouseMove(x, y);
            this.worldMap.handleClick(x, y);
        }
    }

    // 检测点击是否在圆形选项内
    isPointInOption(x, y, option) {
        const dx = x - option.x;
        const dy = y - option.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= option.radius;
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
        if (this.currentStage === 'battle') return;

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

    // 渲染单个出身选项 - 圆形卡片
    renderOriginOption(option) {
        const ctx = this.ctx;
        const isHovered = this.hoveredOption === option.id;
        const isSelected = this.selectedOption === option.id;
        const r = option.radius;

        // 动画缩放
        let scale = 1;
        if (isHovered) scale = 1.08;
        if (isSelected) scale = 0.95;

        ctx.save();
        ctx.translate(option.x, option.y);
        ctx.scale(scale, scale);

        // 外圈光晕
        if (isHovered || isSelected) {
            ctx.shadowColor = option.color;
            ctx.shadowBlur = 30;
        }

        // 圆形背景
        const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        bgGradient.addColorStop(0, 'rgba(40, 40, 60, 0.95)');
        bgGradient.addColorStop(0.7, 'rgba(30, 30, 50, 0.9)');
        bgGradient.addColorStop(1, 'rgba(20, 20, 40, 0.8)');
        ctx.fillStyle = bgGradient;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // 边框
        ctx.strokeStyle = isHovered || isSelected ? option.color : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = isHovered || isSelected ? 4 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // 内圈装饰
        ctx.strokeStyle = option.color + '40';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r - 8, 0, Math.PI * 2);
        ctx.stroke();

        // 人物头像（大）
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(option.avatar, 0, -8);

        // 场景图标（小，在右上角）
        ctx.font = '16px sans-serif';
        ctx.fillText(option.icon, r * 0.5, -r * 0.5);

        // 名称
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(option.name, 0, r * 0.4);

        // 副标题
        ctx.fillStyle = option.color;
        ctx.font = '10px sans-serif';
        ctx.fillText(option.subtitle, 0, r * 0.55);

        // 简短描述
        ctx.fillStyle = '#aaa';
        ctx.font = '9px sans-serif';
        ctx.fillText(option.description, 0, r * 0.75);

        ctx.restore();
    }
}

/**
 * 球形世界地图类
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
        this.ringCount = 5;
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
            plains: { angle: -135, color: '#8B7355', icon: '⛰️', name: '山丘领主' },
            ocean: { angle: -45, color: '#0066CC', icon: '🌊', name: '深海行者' },
            space: { angle: 135, color: '#9933FF', icon: '🚀', name: '星际旅者' },
            grassland: { angle: 45, color: '#44AA44', icon: '🌿', name: '草原之魂' }
        };

        // 玩家位置
        this.playerOrigin = null;
        this.playerPos = null;

        // 格子数据
        this.cells = [];

        // 可见范围
        this.visibilityRange = 1;

        // 悬停的格子
        this.hoveredCell = null;

        // 动画
        this.sphereRotation = 0;
    }

    // 初始化地图
    init(playerOrigin) {
        this.playerOrigin = playerOrigin;

        // 玩家出生在第4环
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
            const cellCount = 8 + ring * 4;

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
        // 将玩家角度转换为 0-360 范围
        const playerAngle = ((this.playerPos.angle % 360) + 360) % 360;

        // 找到玩家所在的格子
        let playerCell = null;
        let minAngleDiff = Infinity;

        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                const angleDiff = Math.abs(cell.angle - playerAngle);
                const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

                if (cell.ring === this.playerPos.ring && normalizedDiff < minAngleDiff) {
                    minAngleDiff = normalizedDiff;
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

        // 如果没有找到玩家格子，设置一个默认的可见区域
        if (!playerCell && this.cells[4]) {
            for (let cell of this.cells[4]) {
                cell.visible = true;
            }
        }
    }

    // 生成怪物
    generateMonsters() {
        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                if (!cell.conquered) {
                    const difficulty = ring + 1;
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
        // 直接查找点击的格子
        let clickedCell = null;
        let minDist = Infinity;

        for (let ring = 0; ring < this.ringCount; ring++) {
            for (let cell of this.cells[ring]) {
                if (!cell.visible) continue;

                const dist = Math.sqrt(
                    Math.pow(x - cell.x, 2) +
                    Math.pow(y - cell.y, 2)
                );

                if (dist < this.gridSize && dist < minDist) {
                    minDist = dist;
                    clickedCell = cell;
                }
            }
        }

        if (!clickedCell) return;

        // 点击有怪物的格子进入战斗
        if (clickedCell.monster) {
            this.startBattleWithMonster(clickedCell);
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

        // 保存当前战斗的格子
        this.currentBattleCell = cell;

        // 调用 GameFlow 的 startBattle 方法
        const sceneType = sceneMap[this.playerOrigin];
        if (sceneType && this.gameFlow) {
            this.gameFlow.startBattle(sceneType);
        }
    }

    // 占领格子
    conquerCell(cell) {
        cell.conquered = true;
        cell.monster = null;
        this.checkTreasureAccess();
    }

    // 检查是否可以占领宝藏
    checkTreasureAccess() {
        const innerRingConquered = this.cells[0].every(cell => cell.conquered);
        if (innerRingConquered) {
            this.treasure.conquered = true;
        }
    }

    // 渲染地图
    render(ctx, animationTime) {
        // 背景
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

        // 绘制其他出生点
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
        const pulse = Math.sin(animationTime * 2) * 5;

        ctx.save();

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.sphereRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.sphereRadius + 10 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
        ctx.lineWidth = 3;
        ctx.stroke();

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
            ctx.save();

            const ringColors = ['#2a2a4a', '#252545', '#202040', '#1a1a3a', '#151535'];
            ctx.fillStyle = cell.conquered ? '#3a3a5a' : ringColors[cell.ring];

            if (isHovered) {
                ctx.fillStyle = '#4a4a6a';
            }

            this.drawHexagon(ctx, cell.x, cell.y, this.gridSize / 2 - 2);
            ctx.fill();

            ctx.strokeStyle = cell.conquered ? '#5a5a7a' : 'rgba(100,100,150,0.3)';
            ctx.lineWidth = isHovered ? 2 : 1;
            this.drawHexagon(ctx, cell.x, cell.y, this.gridSize / 2 - 2);
            ctx.stroke();

            if (cell.monster) {
                this.renderCellMonster(ctx, cell, animationTime);
            }

            if (cell.conquered) {
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#44aa44';
                ctx.fillText('✓', cell.x, cell.y + 4);
            }

            ctx.restore();
        } else {
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

        if (isHovered) {
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        const monsterIcons = { melee: '👹', ranged: '👺', tank: '👾' };
        ctx.fillText(monsterIcons[cell.monster.type] || '👹', 0, 6 + breathe);

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

        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, this.treasure.radius + pulse);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.treasure.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(rotate * Math.PI / 180);
        ctx.fillStyle = '#FFD700';
        this.drawStar(ctx, 0, 0, 5, this.treasure.radius - 5, this.treasure.radius - 15);
        ctx.fill();

        ctx.rotate(-rotate * Math.PI / 180);

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💎', 0, 10);

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

    // 渲染远处的出生点
    renderDistantSpawnPoint(ctx, origin, data, animationTime) {
        const radius = this.sphereRadius + 40;
        const x = this.centerX + Math.cos((data.angle - 90) * Math.PI / 180) * radius;
        const y = this.centerY + Math.sin((data.angle - 90) * Math.PI / 180) * radius;

        const breathe = Math.sin(animationTime * 2 + data.angle) * 0.2 + 0.8;
        const alpha = 0.6 * breathe;

        ctx.save();
        ctx.globalAlpha = alpha;

        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
        glowGradient.addColorStop(0, data.color + '60');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = data.color + '40';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(data.icon, x, y + 8);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = data.color;
        ctx.fillText('???', x, y - 32);

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
        let playerX, playerY;

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

        ctx.beginPath();
        ctx.arc(0, 0, 25 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧙', 0, 9);

        ctx.restore();
    }

    // 渲染UI
    renderUI(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('世界地图', this.width/2, 30);

        const originNames = {
            plains: '丘陵领地',
            ocean: '深海领域',
            space: '太空站',
            grassland: '草原部落'
        };

        ctx.fillStyle = '#888';
        ctx.font = '12px sans-serif';
        ctx.fillText(`当前位置: ${originNames[this.playerOrigin]}`, this.width/2, 50);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.fillText('点击周围的小怪开始战斗', this.width/2, this.height - 20);
    }
}
