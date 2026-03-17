/**
 * 移动系统 - 处理单位移动
 */
class MoveSystem {
    constructor(game) {
        this.game = game;
    }

    update(entities, deltaTime) {
        for (const entity of entities) {
            if (!entity.active || !entity.canMove) continue;

            // 如果有战斗目标，不移动
            if (entity.isInCombat) {
                entity.velocity.set(0, 0);

                // 应用阵型偏移（平滑插值）
                if (entity.formationOffset) {
                    const targetX = entity.position.x + entity.formationOffset.x;
                    const targetY = entity.position.y + entity.formationOffset.y;

                    // 只在阵型位置附近微调，不改变主要位置
                    const dx = targetX - entity.position.x;
                    const dy = targetY - entity.position.y;

                    entity.position.x += dx * 2 * deltaTime;
                    entity.position.y += dy * 2 * deltaTime;
                }

                continue;
            }

            // 弧形路径移动 - 根据Y坐标计算X坐标
            const lane = this.game.lanes[entity.lane];
            const currentY = entity.position.y;

            // 计算目标X位置
            const targetX = this.game.getLaneXAtY(entity.lane, currentY);

            // 计算移动方向
            const moveSpeed = entity.speed * deltaTime;

            if (entity.team === 0) {
                // 玩家方向上移动
                entity.position.y -= moveSpeed;

                // 平滑调整X位置跟随路径
                const dx = targetX - entity.position.x;
                entity.position.x += dx * 0.1;

                // 检查是否到达敌方基地
                if (entity.position.y <= this.game.layout.enemyBase.y + 30) {
                    this.game.enemyBaseHP -= 10;
                    entity.active = false;
                }
            } else {
                // 敌方向下移动
                entity.position.y += moveSpeed;

                // 平滑调整X位置跟随路径
                const dx = targetX - entity.position.x;
                entity.position.x += dx * 0.1;

                // 检查是否到达我方基地
                if (entity.position.y >= this.game.layout.playerBase.y - 40) {
                    this.game.playerBaseHP -= 10;
                    entity.active = false;
                }
            }
        }
    }
}
