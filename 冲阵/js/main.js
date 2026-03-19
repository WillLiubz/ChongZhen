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

    // 初始化键盘控制和场景/路数按钮
    initKeyboard();
    initSceneControls();
    initLaneControls();

    // 初始屯兵
    for (let i = 0; i < game.laneCount; i++) {
        game.addTroop(i, 3);
    }

    // 启动游戏
    game.start();

    // 启动定时器
    startGameTimers();
}

// 更新场景按钮状态
function updateSceneButton(sceneType) {
    const buttons = document.querySelectorAll('.scene-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.scene === sceneType);
    });
}

// 键盘控制（出兵 + R 重新开始）
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (!game || !game.running) return;

        // R 键重新开始
        if (e.key.toLowerCase() === 'r' && game.gameOver) {
            gameTimers.forEach(timer => clearInterval(timer));
            gameTimers = [];
            game.stop();
            game = null;
            gameFlow = null;
            initGameFlow();
            return;
        }

        if (game.gameOver) return;

        const key = e.key.toLowerCase();
        const laneCount = game.laneCount;

        if (laneCount === 1) {
            if (key === 'w' && game.troops[0].count > 0) game.spawnUnit(0, 0);
        } else if (laneCount === 2) {
            if (key === 'q' && game.troops[0].count > 0) game.spawnUnit(0, 0);
            else if (key === 'e' && game.troops[1].count > 0) game.spawnUnit(1, 0);
        } else {
            if (key === 'q' && game.troops[0].count > 0) game.spawnUnit(0, 0);
            else if (key === 'w' && game.troops[1].count > 0) game.spawnUnit(1, 0);
            else if (key === 'e' && game.troops[2].count > 0) game.spawnUnit(2, 0);
        }
    });
}

// 敌方AI
function enemyAI() {
    if (!game || !game.running || game.gameOver) return;
    const laneIndex = Math.floor(Math.random() * game.laneCount);
    const rand = Math.random();
    let unitType = rand > 0.85 ? 'tank' : rand > 0.6 ? 'ranged' : 'melee';
    game.spawnUnit(laneIndex, 1, unitType);
}

// 屯兵增长
function troopGrowth() {
    if (!game || !game.running || game.gameOver) return;
    for (let i = 0; i < game.laneCount; i++) {
        if (game.troops[i]) game.addTroop(i, 1);
    }
}

// 场景切换按钮
function initSceneControls() {
    const sceneButtons = document.querySelectorAll('.scene-btn');
    sceneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!game) return;
            const sceneKey = btn.dataset.scene;
            if (game.sceneManager.switchScene(sceneKey)) {
                sceneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
}

// 路数切换按钮
function initLaneControls() {
    const laneButtons = document.querySelectorAll('.lane-count-btn');
    laneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!game) return;
            const laneCount = parseInt(btn.dataset.lanes);
            if (game.setLaneCount(laneCount)) {
                laneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
}

// 游戏定时器
let gameTimers = [];

function startGameTimers() {
    gameTimers.forEach(timer => clearInterval(timer));
    gameTimers = [];
    gameTimers.push(setInterval(enemyAI, 3000));
    gameTimers.push(setInterval(troopGrowth, 2000));
}

// 初始化游戏流程
initGameFlow();
