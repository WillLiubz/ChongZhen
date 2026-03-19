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

        // 更新所有实体的战斗状态
        this.updateCombatState(entities, now);
    }

    checkCollisionsInLane(entities, now) {
        // 按y坐标排序，优化检测
        entities.sort((a, b) => a.position.y - b.position.y);

        // 检测敌对单位碰撞
        for (let i = 0; i < entities.length; i++) {
            const entityA = entities[i];
            if (!entityA.active || entityA.isInCombat) continue;

            for (let j = i + 1; j < entities.length; j++) {
                const entityB = entities[j];
                if (!entityB.active || entityB.isInCombat) continue;

                // 如果距离太远，跳过（因为已按y排序）
                if (entityB.position.y - entityA.position.y > entityA.radius + entityB.radius + 30) {
                    break;
                }

                // 只处理不同阵营的碰撞
                if (entityA.team === entityB.team) continue;

                // 检测碰撞
                const dist = entityA.position.distanceTo(entityB.position);
                const minDist = entityA.radius + entityB.radius;

                if (dist < minDist + 10) { // 增加一点缓冲距离
                    this.initiateCombat(entityA, entityB, entities, now);
                }
            }
        }
    }

    // 发起战斗
    initiateCombat(entityA, entityB, allEntities, now) {
        // 找到双方周围的友军，形成军团战斗
        const groupA = this.findCombatGroup(entityA, allEntities);
        const groupB = this.findCombatGroup(entityB, allEntities);

        // 设置战斗目标
        for (const unit of groupA) {
            if (!unit.isInCombat) {
                unit.enterCombat(entityB);
                unit.combatGroup = groupA.filter(u => u !== unit);
            }
        }

        for (const unit of groupB) {
            if (!unit.isInCombat) {
                unit.enterCombat(entityA);
                unit.combatGroup = groupB.filter(u => u !== unit);
            }
        }

        // 设置阵型位置
        this.arrangeFormation(groupA, entityB.position);
        this.arrangeFormation(groupB, entityA.position);
    }

    // 寻找战斗组（周围的友军）
    findCombatGroup(leader, allEntities) {
        const group = [leader];
        const searchRadius = 80; // 搜索范围

        for (const entity of allEntities) {
            if (entity === leader) continue;
            if (!entity.active) continue;
            if (entity.team !== leader.team) continue;
            if (entity.isInCombat) continue; // 已经在战斗中的不加入

            const dist = entity.position.distanceTo(leader.position);
            if (dist < searchRadius) {
                group.push(entity);
            }
        }

        // 限制军团大小
        return group.slice(0, 5);
    }

    // 安排阵型
    arrangeFormation(group, targetPos) {
        if (group.length <= 1) return;

        const centerUnit = group[0];
        const angleToTarget = Math.atan2(
            targetPos.y - centerUnit.position.y,
            targetPos.x - centerUnit.position.x
        );

        // 弧形阵型
        for (let i = 1; i < group.length; i++) {
            const unit = group[i];
            const side = i % 2 === 0 ? 1 : -1;
            const offsetAngle = angleToTarget + side * (Math.PI / 4) * Math.ceil(i / 2);
            const offsetDist = 25;

            unit.formationOffset = {
                x: Math.cos(offsetAngle) * offsetDist,
                y: Math.sin(offsetAngle) * offsetDist
            };
        }
    }

    // 更新战斗状态
    updateCombatState(entities, now) {
        for (const entity of entities) {
            if (!entity.active) continue;

            // 更新伤害数字
            entity.updateDamageNumbers(this.game.deltaTime);
            entity.updateAttackEffect(now);

            if (entity.isInCombat) {
                // 检查目标是否死亡或脱离
                if (!entity.combatTarget || !entity.combatTarget.active) {
                    // 寻找新目标
                    const newTarget = this.findNewTarget(entity, entities);
                    if (newTarget) {
                        entity.combatTarget = newTarget;
                    } else {
                        entity.exitCombat();
                    }
                } else {
                    // 继续攻击
                    this.performCombat(entity, now);
                }
            }
        }
    }

    // 寻找新目标
    findNewTarget(entity, allEntities) {
        let closestTarget = null;
        let closestDist = Infinity;

        for (const other of allEntities) {
            if (!other.active) continue;
            if (other.team === entity.team) continue;

            const dist = entity.position.distanceTo(other.position);
            if (dist < 60 && dist < closestDist) { // 攻击范围内
                closestDist = dist;
                closestTarget = other;
            }
        }

        return closestTarget;
    }

    // 执行战斗
    performCombat(attacker, now) {
        const target = attacker.combatTarget;
        if (!target || !target.active) return;

        // 检查距离
        const dist = attacker.position.distanceTo(target.position);
        if (dist > attacker.attackRange + 20) {
            // 目标太远，退出战斗
            attacker.exitCombat();
            return;
        }

        // 攻击
        if (attacker.canAttack(now)) {
            attacker.attackTarget(target, now, this.game);

            // 军团协同攻击 - 友军也会攻击同一目标
            for (const ally of attacker.combatGroup) {
                if (ally.active && ally.canAttack(now)) {
                    const allyDist = ally.position.distanceTo(target.position);
                    if (allyDist <= ally.attackRange + 20) {
                        ally.attackTarget(target, now, this.game);
                    }
                }
            }
        }
    }

    // 简单的分离处理（同阵营）
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
