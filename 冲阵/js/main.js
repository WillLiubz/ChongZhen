/**
 * 游戏入口 - 新流程：出身选择 -> 世界地图 -> 战斗
 */
const canvas = document.getElementById('gameCanvas');
const gameControls = document.getElementById('gameControls');
const sceneControls = document.getElementById('sceneControls');
const laneControls = document.getElementById('laneControls');

let game = null;
let gameFlow = null;

// 初始化游戏流程
function initGameFlow() {
    gameFlow = new GameFlow(canvas);

    // 设置战斗开始回调
    gameFlow.onBattleStart = (sceneType) => {
        startBattle(sceneType);
    };
}

// 开始战斗
function startBattle(sceneType) {
    // 隐藏流程控制，显示游戏控制
    gameControls.style.display = 'block';

    // 停止 GameFlow 的动画循环
    if (gameFlow) {
        gameFlow.currentStage = 'battle';
    }

    // 创建游戏实例
    game = new Game(canvas);

    // 切换到对应场景
    if (sceneType) {
        game.sceneManager.switchScene(sceneType);
        updateSceneButton(sceneType);
    }

    // 初始化控制
    initControls();
    initSceneControls();
    initLaneControls();
    updateSpawnButtons();

    // 初始屯兵
    for (let i = 0; i < game.laneCount; i++) {
        game.addTroop(i, 3);
    }

    // 启动游戏
    game.start();

    // 启动定时器
    startGameTimers();

    console.log('战斗开始！场景:', sceneType);
}

// 更新场景按钮状态
function updateSceneButton(sceneType) {
    const sceneMap = {
        'land': 'land',
        'ocean': 'ocean',
        'space': 'space',
        'grassland': 'grassland'
    };

    const buttons = document.querySelectorAll('.scene-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.scene === sceneMap[sceneType]) {
            btn.classList.add('active');
        }
    });
}

// 出兵按钮
let spawnButtons = [];

function initControls() {
    spawnButtons = [
        document.getElementById('spawnLeft'),
        document.getElementById('spawnMid'),
        document.getElementById('spawnRight')
    ];

    // 左路出兵
    spawnButtons[0].addEventListener('click', () => {
        const laneCount = game.laneCount;
        const laneIndex = laneCount === 2 ? 0 : 0;
        if (game.troops[laneIndex] && game.troops[laneIndex].count > 0) {
            game.spawnUnit(laneIndex, 0);
        }
    });

    // 中路出兵
    spawnButtons[1].addEventListener('click', () => {
        const laneCount = game.laneCount;
        const laneIndex = laneCount === 1 ? 0 : 1;
        if (game.troops[laneIndex] && game.troops[laneIndex].count > 0) {
            game.spawnUnit(laneIndex, 0);
        }
    });

    // 右路出兵
    spawnButtons[2].addEventListener('click', () => {
        const laneCount = game.laneCount;
        const laneIndex = laneCount === 2 ? 1 : 2;
        if (game.troops[laneIndex] && game.troops[laneIndex].count > 0) {
            game.spawnUnit(laneIndex, 0);
        }
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!game || !game.running) return;

        // R 键重新开始
        if (e.key.toLowerCase() === 'r' && game.gameOver) {
            gameTimers.forEach(timer => clearInterval(timer));
            gameTimers = [];
            game.stop();
            game = null;
            gameFlow = null;
            gameControls.style.display = 'none';
            initGameFlow();
            return;
        }

        const key = e.key.toLowerCase();
        const laneCount = game.laneCount;

        if (laneCount === 1) {
            if (key === 'w' && game.troops[0].count > 0) {
                game.spawnUnit(0, 0);
            }
        } else if (laneCount === 2) {
            if (key === 'q' && game.troops[0].count > 0) {
                game.spawnUnit(0, 0);
            } else if (key === 'e' && game.troops[1].count > 0) {
                game.spawnUnit(1, 0);
            }
        } else {
            if (key === 'q' && game.troops[0].count > 0) {
                game.spawnUnit(0, 0);
            } else if (key === 'w' && game.troops[1].count > 0) {
                game.spawnUnit(1, 0);
            } else if (key === 'e' && game.troops[2].count > 0) {
                game.spawnUnit(2, 0);
            }
        }
    });
}

// 敌方AI
function enemyAI() {
    if (!game || !game.running) return;
    const laneIndex = Math.floor(Math.random() * game.laneCount);
    const rand = Math.random();
    let unitType = 'melee';
    if (rand > 0.6) unitType = 'ranged';
    else if (rand > 0.85) unitType = 'tank';
    game.spawnUnit(laneIndex, 1, unitType);
}

// 屯兵增长
function troopGrowth() {
    if (!game || !game.running) return;
    for (let i = 0; i < game.laneCount; i++) {
        if (game.troops[i]) {
            game.addTroop(i, 1);
        }
    }
}

// 更新按钮状态
function updateButtonStates() {
    if (!game || !game.running) return;

    const laneCount = game.laneCount;
    for (let i = 0; i < 3; i++) {
        let shouldCheck = false;
        if (laneCount === 1 && i === 1) shouldCheck = true;
        else if (laneCount === 2 && (i === 0 || i === 2)) shouldCheck = true;
        else if (laneCount === 3) shouldCheck = true;

        if (shouldCheck && game.troops[i]) {
            const hasTroops = game.troops[i].count > 0;
            spawnButtons[i].disabled = !hasTroops;
            spawnButtons[i].style.opacity = hasTroops ? '1' : '0.5';
        } else if (spawnButtons[i].style.display !== 'none') {
            spawnButtons[i].disabled = false;
            spawnButtons[i].style.opacity = '1';
        }
    }
}

// 场景切换按钮
function initSceneControls() {
    const sceneButtons = document.querySelectorAll('.scene-btn');

    sceneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sceneKey = btn.dataset.scene;

            if (game.sceneManager.switchScene(sceneKey)) {
                sceneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                console.log(`切换到场景: ${game.sceneManager.getCurrentScene().name}`);
            }
        });
    });
}

// 路数切换按钮
function initLaneControls() {
    const laneButtons = document.querySelectorAll('.lane-count-btn');

    laneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const laneCount = parseInt(btn.dataset.lanes);

            if (game.setLaneCount(laneCount)) {
                laneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateSpawnButtons();
                console.log(`切换到${laneCount}条路模式`);
            }
        });
    });
}

// 更新出兵按钮
function updateSpawnButtons() {
    const laneCount = game.laneCount;
    const leftBtn = document.getElementById('spawnLeft');
    const midBtn = document.getElementById('spawnMid');
    const rightBtn = document.getElementById('spawnRight');

    leftBtn.style.display = 'none';
    midBtn.style.display = 'none';
    rightBtn.style.display = 'none';

    if (laneCount === 1) {
        midBtn.style.display = 'block';
        midBtn.textContent = '出兵 (W)';
    } else if (laneCount === 2) {
        leftBtn.style.display = 'block';
        rightBtn.style.display = 'block';
        leftBtn.textContent = '左路出兵 (Q)';
        rightBtn.textContent = '右路出兵 (E)';
    } else {
        leftBtn.style.display = 'block';
        midBtn.style.display = 'block';
        rightBtn.style.display = 'block';
        leftBtn.textContent = '左路出兵 (Q)';
        midBtn.textContent = '中路出兵 (W)';
        rightBtn.textContent = '右路出兵 (E)';
    }
}

// 游戏定时器
let gameTimers = [];

function startGameTimers() {
    // 清除旧定时器
    gameTimers.forEach(timer => clearInterval(timer));
    gameTimers = [];

    // 启动新定时器
    gameTimers.push(setInterval(enemyAI, 3000));
    gameTimers.push(setInterval(troopGrowth, 2000));
    gameTimers.push(setInterval(updateButtonStates, 100));
}

// 初始化游戏流程
initGameFlow();

console.log('游戏流程已启动');
console.log('流程：选择出身 -> 世界地图 -> 战斗');
// Debug version: 1773892439
