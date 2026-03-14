/**
 * 单位工厂 - 创建不同类型的单位
 */
class UnitFactory {
    constructor(game) {
        this.game = game;
    }

    createMelee(lane, team) {
        const entity = this.game.spawnUnit(lane, team);
        entity.type = 'melee';
        entity.radius = 12;
        entity.hp = entity.maxHp = 150;
        entity.attack = 15;
        entity.attackSpeed = 1;
        entity.attackRange = 25;
        return entity;
    }

    createRanged(lane, team) {
        const entity = this.game.spawnUnit(lane, team);
        entity.type = 'ranged';
        entity.radius = 10;
        entity.hp = entity.maxHp = 80;
        entity.attack = 12;
        entity.attackSpeed = 1.5;
        entity.attackRange = 80;
        return entity;
    }

    createTank(lane, team) {
        const entity = this.game.spawnUnit(lane, team);
        entity.type = 'tank';
        entity.radius = 15;
        entity.hp = entity.maxHp = 300;
        entity.attack = 8;
        entity.attackSpeed = 0.5;
        entity.attackRange = 25;
        return entity;
    }
}
