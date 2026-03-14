/**
 * 游戏入口
 */
const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

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
        const laneIndex = laneCount === 2 ? 0 : 0; // 2路时左路是0，3路时左路是0
        if (game.troops[laneIndex] && game.troops[laneIndex].count > 0) {
            game.spawnUnit(laneIndex, 0);
        }
    });

    // 中路出兵
    spawnButtons[1].addEventListener('click', () => {
        const laneCount = game.laneCount;
        const laneIndex = laneCount === 1 ? 0 : 1; // 1路时唯一路是0，3路时中路是1
        if (game.troops[laneIndex] && game.troops[laneIndex].count > 0) {
            game.spawnUnit(laneIndex, 0);
        }
    });

    // 右路出兵
    spawnButtons[2].addEventListener('click', () => {
        const laneCount = game.laneCount;
        const laneIndex = laneCount === 2 ? 1 : 2; // 2路时右路是1，3路时右路是2
        if (game.troops[laneIndex] && game.troops[laneIndex].count > 0) {
            game.spawnUnit(laneIndex, 0);
        }
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        const laneCount = game.laneCount;

        if (laneCount === 1) {
            // 1条路模式 - W出兵
            if (key === 'w' && game.troops[0].count > 0) {
                game.spawnUnit(0, 0);
            }
        } else if (laneCount === 2) {
            // 2条路模式 - Q左路, E右路
            if (key === 'q' && game.troops[0].count > 0) {
                game.spawnUnit(0, 0);
            } else if (key === 'e' && game.troops[1].count > 0) {
                game.spawnUnit(1, 0);
            }
        } else {
            // 3条路模式 - QWE
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

// 敌方AI - 定时出兵
function enemyAI() {
    const laneIndex = Math.floor(Math.random() * game.laneCount);
    const rand = Math.random();
    let unitType = 'melee';
    if (rand > 0.6) unitType = 'ranged';
    else if (rand > 0.85) unitType = 'tank';
    game.spawnUnit(laneIndex, 1, unitType);
}

// 屯兵增长
function troopGrowth() {
    for (let i = 0; i < game.laneCount; i++) {
        if (game.troops[i]) {
            game.addTroop(i, 1);
        }
    }
}

// 更新按钮状态
function updateButtonStates() {
    const laneCount = game.laneCount;
    for (let i = 0; i < 3; i++) {
        // 根据路数决定是否检查该按钮
        let shouldCheck = false;
        if (laneCount === 1 && i === 1) shouldCheck = true; // 只有中路
        else if (laneCount === 2 && (i === 0 || i === 2)) shouldCheck = true; // 左右路
        else if (laneCount === 3) shouldCheck = true; // 全部

        if (shouldCheck && game.troops[i]) {
            const hasTroops = game.troops[i].count > 0;
            spawnButtons[i].disabled = !hasTroops;
            spawnButtons[i].style.opacity = hasTroops ? '1' : '0.5';
        } else if (spawnButtons[i].style.display !== 'none') {
            // 如果按钮显示但不该检查，保持可用状态
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

            // 切换场景
            if (game.sceneManager.switchScene(sceneKey)) {
                // 更新按钮状态
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

            // 切换路数
            if (game.setLaneCount(laneCount)) {
                // 更新按钮状态
                laneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 更新出兵按钮显示
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

    // 重置所有按钮
    leftBtn.style.display = 'none';
    midBtn.style.display = 'none';
    rightBtn.style.display = 'none';

    // 根据路数显示对应按钮
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

// 初始化
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

// 定时器
setInterval(enemyAI, 3000);      // 敌方每3秒出兵
setInterval(troopGrowth, 2000);  // 每2秒增加屯兵
setInterval(updateButtonStates, 100); // 更新按钮状态

// 调试信息
console.log('游戏已启动');
console.log('操作方式：');
console.log('- Q/W/E 或点击按钮出兵');
console.log('- 需要屯兵区有士兵才能出兵');
console.log('- 点击右上角按钮切换场景');
console.log('- 点击右侧数字按钮切换路数 (1/2/3)');
