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

        // 战斗目标
        this.combatTarget = null;
        this.canMove = true;
    }

    reset() {
        this.active = true;
        this.position.set(0, 0);
        this.velocity.set(0, 0);
        this.hp = this.maxHp;
        this.lastAttackTime = 0;
        this.combatTarget = null;
        this.canMove = true;
        this.unitType = 'melee';
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
        }
    }

    canAttack(now) {
        return now - this.lastAttackTime >= 1000 / this.attackSpeed;
    }

    attackTarget(target, now) {
        if (this.canAttack(now)) {
            target.takeDamage(this.attack);
            this.lastAttackTime = now;
            return true;
        }
        return false;
    }
}
