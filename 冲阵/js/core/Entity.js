/**
 * 实体基类 - 游戏世界中的对象
 */
class Entity {
    constructor(id) {
        this.id = id;
        this.active = true;

        // 变换组件
        this.position = new Vector2();
        this.velocity = new Vector2();
        this.radius = 10;  // 碰撞半径

        // 战斗属性
        this.hp = 100;
        this.maxHp = 100;
        this.attack = 10;
        this.attackRange = 30;
        this.attackSpeed = 1;  // 每秒攻击次数
        this.lastAttackTime = 0;

        // 移动属性
        this.speed = 100;  // 像素/秒
        this.lane = 1;     // 0=左, 1=中, 2=右
        this.team = 0;     // 0=玩家, 1=敌方

        // 渲染属性
        this.color = '#4CAF50';
        this.unitType = 'melee';  // melee/ranged/tank/hero

        // 战斗状态
        this.combatTarget = null;
        this.canMove = true;
        this.isInCombat = false;
        this.combatGroup = []; // 军团战斗中的友军
        this.formationOffset = { x: 0, y: 0 }; // 阵型偏移

        // 视觉效果
        this.attackEffect = null; // 攻击特效
        this.damageNumbers = [];  // 伤害数字
    }

    reset() {
        this.active = true;
        this.position.set(0, 0);
        this.velocity.set(0, 0);
        this.hp = this.maxHp;
        this.lastAttackTime = 0;
        this.combatTarget = null;
        this.canMove = true;
        this.isInCombat = false;
        this.combatGroup = [];
        this.formationOffset = { x: 0, y: 0 };
        this.attackEffect = null;
        this.damageNumbers = [];
        this.unitType = 'melee';
    }

    takeDamage(damage, isSkill = false) {
        this.hp -= damage;

        // 添加伤害数字
        this.damageNumbers.push({
            value: damage,
            isSkill: isSkill,
            life: 1.0,
            offsetY: 0
        });

        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
        }
    }

    canAttack(now) {
        return now - this.lastAttackTime >= 1000 / this.attackSpeed;
    }

    attackTarget(target, now, game) {
        if (this.canAttack(now)) {
            // 创建攻击特效
            this.attackEffect = {
                target: target,
                startTime: now,
                duration: 200
            };

            // 计算伤害（应用士气加成）
            let damage = this.attack;
            if (game) {
                const moraleBonus = game.getMoraleDamageBonus(this.team);
                damage = Math.round(damage * moraleBonus);
            }

            target.takeDamage(damage);
            this.lastAttackTime = now;
            return true;
        }
        return false;
    }

    // 进入战斗状态
    enterCombat(target) {
        this.isInCombat = true;
        this.combatTarget = target;
        this.canMove = false;
        this.velocity.set(0, 0);
    }

    // 退出战斗状态
    exitCombat() {
        this.isInCombat = false;
        this.combatTarget = null;
        this.canMove = true;
        this.combatGroup = [];
    }

    // 更新伤害数字
    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dmg = this.damageNumbers[i];
            dmg.life -= deltaTime;
            dmg.offsetY -= 30 * deltaTime; // 向上飘动

            if (dmg.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    // 更新攻击特效
    updateAttackEffect(now) {
        if (this.attackEffect && now - this.attackEffect.startTime > this.attackEffect.duration) {
            this.attackEffect = null;
        }
    }
}
