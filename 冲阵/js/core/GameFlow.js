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
 * 世界地图类
 */
class WorldMap {
    constructor(gameFlow) {
        this.gameFlow = gameFlow;
        this.width = 500;
        this.height = 800;

        // 地图格子配置
        this.gridSize = 50;
        this.cols = 10;
        this.rows = 16;

        // 四个出生点位置（固定在世界四角）
        this.spawnPoints = {
            plains: { col: 2, row: 2, color: '#8B7355', icon: '⛰️' },      // 左上
            ocean: { col: 7, row: 2, color: '#0066CC', icon: '🌊' },       // 右上
            space: { col: 2, row: 13, color: '#9933FF', icon: '🚀' },      // 左下
            grassland: { col: 7, row: 13, color: '#44AA44', icon: '🌿' }   // 右下
        };

        // 玩家当前位置
        this.playerPos = null;

        // 迷雾状态: true = 可见, false = 迷雾
        this.fogOfWar = [];

        // 可见范围（格子数）
        this.visibilityRange = 2;

        // 小怪位置
        this.monsters = [];

        // 悬停的格子
        this.hoveredCell = null;
    }

    // 初始化地图
    init(playerOrigin) {
        this.playerOrigin = playerOrigin;
        this.playerPos = { ...this.spawnPoints[playerOrigin] };

        // 初始化迷雾
        this.fogOfWar = [];
        for (let r = 0; r < this.rows; r++) {
            this.fogOfWar[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.fogOfWar[r][c] = false;
            }
        }

        // 更新可见区域
        this.updateVisibility();

        // 生成小怪（只在可见区域内）
        this.generateMonsters();
    }

    // 更新可见区域
    updateVisibility() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const dist = Math.sqrt(
                    Math.pow(c - this.playerPos.col, 2) +
                    Math.pow(r - this.playerPos.row, 2)
                );
                if (dist <= this.visibilityRange) {
                    this.fogOfWar[r][c] = true;
                }
            }
        }
    }

    // 生成小怪
    generateMonsters() {
        this.monsters = [];

        // 在玩家周围生成2-3个小怪
        const directions = [
            { dc: 1, dr: 0 }, { dc: -1, dr: 0 },
            { dc: 0, dr: 1 }, { dc: 0, dr: -1 },
            { dc: 1, dr: 1 }, { dc: -1, dr: -1 }
        ];

        for (const dir of directions) {
            const newCol = this.playerPos.col + dir.dc;
            const newRow = this.playerPos.row + dir.dr;

            if (this.isValidCell(newCol, newRow) && Math.random() > 0.3) {
                this.monsters.push({
                    col: newCol,
                    row: newRow,
                    type: Math.random() > 0.5 ? 'melee' : 'ranged',
                    hp: 100,
                    maxHp: 100
                });
            }
        }
    }

    // 检查格子是否有效
    isValidCell(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    // 处理鼠标移动
    handleMouseMove(x, y) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);

        if (this.isValidCell(col, row) && this.fogOfWar[row][col]) {
            this.hoveredCell = { col, row };
            this.gameFlow.canvas.style.cursor = this.getMonsterAt(col, row) ? 'pointer' : 'default';
        } else {
            this.hoveredCell = null;
            this.gameFlow.canvas.style.cursor = 'default';
        }
    }

    // 处理点击
    handleClick(x, y) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);

        if (!this.isValidCell(col, row)) return;
        if (!this.fogOfWar[row][col]) return;

        // 检查是否点击了小怪
        const monster = this.getMonsterAt(col, row);
        if (monster) {
            this.startBattleWithMonster(monster);
        }
    }

    // 获取指定位置的小怪
    getMonsterAt(col, row) {
        return this.monsters.find(m => m.col === col && m.row === row);
    }

    // 与小怪战斗
    startBattleWithMonster(monster) {
        // 根据玩家出身确定战斗场景
        const sceneMap = {
            plains: 'land',
            ocean: 'ocean',
            space: 'space',
            grassland: 'grassland'
        };

        this.gameFlow.startBattle(sceneMap[this.playerOrigin]);
    }

    // 渲染地图
    render(ctx, animationTime) {
        // 背景
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        // 绘制网格和迷雾
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.gridSize;
                const y = r * this.gridSize;
                const isVisible = this.fogOfWar[r][c];

                // 格子背景
                if (isVisible) {
                    ctx.fillStyle = '#1a1a3a';
                    ctx.fillRect(x, y, this.gridSize, this.gridSize);

                    // 网格线
                    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, this.gridSize, this.gridSize);
                } else {
                    // 迷雾
                    ctx.fillStyle = '#050510';
                    ctx.fillRect(x, y, this.gridSize, this.gridSize);
                }
            }
        }

        // 绘制其他出生点（在迷雾中隐约可见）
        for (const [origin, pos] of Object.entries(this.spawnPoints)) {
            if (origin !== this.playerOrigin) {
                this.renderDistantSpawnPoint(ctx, origin, pos, animationTime);
            }
        }

        // 绘制小怪
        for (const monster of this.monsters) {
            this.renderMonster(ctx, monster, animationTime);
        }

        // 绘制玩家
        this.renderPlayer(ctx, animationTime);

        // 绘制UI
        this.renderUI(ctx);
    }

    // 渲染远处的出生点（迷雾中隐约可见）
    renderDistantSpawnPoint(ctx, origin, pos, animationTime) {
        const x = pos.col * this.gridSize;
        const y = pos.row * this.gridSize;
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;

        // 计算距离玩家的距离
        const distToPlayer = Math.sqrt(
            Math.pow(pos.col - this.playerPos.col, 2) +
            Math.pow(pos.row - this.playerPos.row, 2)
        );

        // 只有在迷雾中且不太远才显示
        if (this.fogOfWar[pos.row][pos.col] || distToPlayer > 8) return;

        // 根据距离计算透明度（越远越淡）
        const baseAlpha = Math.max(0.15, 0.5 - distToPlayer * 0.05);

        // 呼吸动画效果
        const breathe = Math.sin(animationTime * 2 + pos.col) * 0.1 + 0.9;
        const alpha = baseAlpha * breathe;

        const spawnInfo = this.gameFlow.originOptions.find(o => o.id === origin);

        ctx.save();
        ctx.globalAlpha = alpha;

        // 绘制背景光晕
        const glowGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.gridSize * 1.5
        );
        glowGradient.addColorStop(0, spawnInfo.color + '40'); // 25% opacity
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - this.gridSize, y - this.gridSize, this.gridSize * 3, this.gridSize * 3);

        // 绘制格子背景（隐约的地形）
        ctx.fillStyle = spawnInfo.color + '20'; // 12% opacity
        ctx.fillRect(x + 5, y + 5, this.gridSize - 10, this.gridSize - 10);

        // 绘制图标
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(spawnInfo.icon, centerX, centerY + 5);

        // 绘制问号提示（表示未知）
        if (Math.sin(animationTime * 3) > 0) {
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = spawnInfo.color;
            ctx.fillText('?', centerX + 12, centerY - 8);
        }

        // 绘制连接线（隐约的路径）
        this.drawFaintPath(ctx, this.playerPos, pos, spawnInfo.color, alpha * 0.3);

        ctx.restore();
    }

    // 绘制隐约的路径线
    drawFaintPath(ctx, from, to, color, alpha) {
        const fromX = from.col * this.gridSize + this.gridSize / 2;
        const fromY = from.row * this.gridSize + this.gridSize / 2;
        const toX = to.col * this.gridSize + this.gridSize / 2;
        const toY = to.row * this.gridSize + this.gridSize / 2;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);

        // 绘制虚线路径
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.restore();
    }

    // 计算到最近可见格子的距离
    getDistanceToVisible(col, row) {
        let minDist = Infinity;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.fogOfWar[r][c]) {
                    const dist = Math.sqrt(Math.pow(c - col, 2) + Math.pow(r - row, 2));
                    minDist = Math.min(minDist, dist);
                }
            }
        }
        return minDist;
    }

    // 渲染小怪
    renderMonster(ctx, monster, animationTime) {
        const x = monster.col * this.gridSize + this.gridSize/2;
        const y = monster.row * this.gridSize + this.gridSize/2;

        // 悬停效果
        const isHovered = this.hoveredCell &&
                         this.hoveredCell.col === monster.col &&
                         this.hoveredCell.row === monster.row;

        // 呼吸动画
        const breathe = Math.sin(animationTime * 3) * 2;
        const size = 15 + breathe;

        // 绘制怪物
        ctx.save();
        ctx.translate(x, y);

        // 选中光圈
        if (isHovered) {
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 怪物图标
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(monster.type === 'melee' ? '👹' : '👺', 0, 7);

        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(-15, -25, 30, 4);

        // 血条
        const hpPercent = monster.hp / monster.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#44aa44' : '#aa4444';
        ctx.fillRect(-15, -25, 30 * hpPercent, 4);

        ctx.restore();
    }

    // 渲染玩家
    renderPlayer(ctx, animationTime) {
        const x = this.playerPos.col * this.gridSize + this.gridSize/2;
        const y = this.playerPos.row * this.gridSize + this.gridSize/2;

        // 脉冲动画
        const pulse = Math.sin(animationTime * 4) * 3;

        ctx.save();
        ctx.translate(x, y);

        // 光环
        ctx.beginPath();
        ctx.arc(0, 0, 20 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
        ctx.fill();

        // 玩家图标
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧙', 0, 8);

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
