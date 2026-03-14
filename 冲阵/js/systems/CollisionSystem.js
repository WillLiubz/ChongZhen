/**
 * 碰撞系统 - 检测和处理单位间的碰撞
 */
class CollisionSystem {
    constructor(game) {
        this.game = game;
    }

    update(entities) {
        const now = performance.now();

        // 按lane分组（动态根据当前路数）
        const laneCount = this.game.laneCount;
        const laneGroups = [];
        for (let i = 0; i < laneCount; i++) {
            laneGroups.push([]);
        }

        for (const entity of entities) {
            if (!entity.active) continue;
            // 确保lane索引在有效范围内
            if (entity.lane >= 0 && entity.lane < laneCount) {
                laneGroups[entity.lane].push(entity);
            }
        }

        // 在每个lane内检测碰撞
        for (const laneEntities of laneGroups) {
            this.checkCollisionsInLane(laneEntities, now);
        }
    }

    checkCollisionsInLane(entities, now) {
        // 按y坐标排序，优化检测
        entities.sort((a, b) => a.position.y - b.position.y);

        for (let i = 0; i < entities.length; i++) {
            const entityA = entities[i];
            if (!entityA.active) continue;

            for (let j = i + 1; j < entities.length; j++) {
                const entityB = entities[j];
                if (!entityB.active) continue;

                // 如果距离太远，跳过（因为已按y排序）
                if (entityB.position.y - entityA.position.y > entityA.radius + entityB.radius + 20) {
                    break;
                }

                // 检测碰撞
                const dist = entityA.position.distanceTo(entityB.position);
                const minDist = entityA.radius + entityB.radius;

                if (dist < minDist) {
                    this.resolveCollision(entityA, entityB, now);
                }
            }
        }
    }

    resolveCollision(entityA, entityB, now) {
        // 同阵营 - 简单分离
        if (entityA.team === entityB.team) {
            this.separateEntities(entityA, entityB);
            return;
        }

        // 不同阵营 - 进入战斗
        // 停止移动
        entityA.velocity.set(0, 0);
        entityB.velocity.set(0, 0);

        // 互相攻击
        entityA.attackTarget(entityB, now);
        entityB.attackTarget(entityA, now);
    }

    separateEntities(entityA, entityB) {
        const dx = entityB.position.x - entityA.position.x;
        const dy = entityB.position.y - entityA.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return;

        const minDist = entityA.radius + entityB.radius;
        const overlap = minDist - dist;
        const separationFactor = overlap / 2;

        const sepX = (dx / dist) * separationFactor;
        const sepY = (dy / dist) * separationFactor;

        entityA.position.x -= sepX;
        entityA.position.y -= sepY;
        entityB.position.x += sepX;
        entityB.position.y += sepY;
    }
}
