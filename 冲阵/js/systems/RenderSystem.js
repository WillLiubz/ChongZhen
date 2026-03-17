/**
 * 渲染系统 - 绘制所有实体
 */
class RenderSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
    }

    render(entities) {
        // 按y坐标排序，实现简单的深度效果
        const sorted = [...entities].sort((a, b) => a.position.y - b.position.y);

        for (const entity of sorted) {
            if (!entity.active) continue;
            this.drawEntity(entity);
        }

        // 绘制伤害数字（在所有实体之上）
        for (const entity of sorted) {
            if (!entity.active) continue;
            this.drawDamageNumbers(entity);
        }
    }

    drawEntity(entity) {
        const ctx = this.ctx;
        const x = entity.position.x;
        const y = entity.position.y;
        const r = entity.radius;

        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y + r - 1, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 根据兵种绘制不同形状
        const unitType = entity.unitType || 'melee';

        if (unitType === 'hero') {
            this.drawHero(ctx, x, y, r, entity);
        } else if (unitType === 'tank') {
            this.drawTank(ctx, x, y, r, entity);
        } else if (unitType === 'ranged') {
            this.drawRanged(ctx, x, y, r, entity);
        } else {
            this.drawMelee(ctx, x, y, r, entity);
        }

        // 绘制血条
        this.drawHealthBar(ctx, x, y, r, entity);

        // 绘制攻击特效
        if (entity.attackEffect) {
            this.drawAttackEffect(ctx, entity);
        }

        // 如果有战斗目标，绘制战斗指示
        if (entity.combatTarget && entity.combatTarget.active) {
            this.drawCombatIndicator(ctx, x, y, entity);
        }

        // 绘制军团战斗光环
        if (entity.isInCombat && entity.combatGroup.length > 0) {
            this.drawGroupCombatAura(ctx, x, y, r, entity);
        }
    }

    // 绘制伤害数字
    drawDamageNumbers(entity) {
        if (!entity.damageNumbers || entity.damageNumbers.length === 0) return;

        const ctx = this.ctx;
        const x = entity.position.x;
        const y = entity.position.y - entity.radius - 15;

        for (const dmg of entity.damageNumbers) {
            const alpha = Math.max(0, dmg.life);
            const offsetY = dmg.offsetY;

            ctx.save();
            ctx.globalAlpha = alpha;

            if (dmg.isSkill) {
                // 技能伤害 - 更大更华丽
                ctx.font = 'bold 18px sans-serif';
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#FF6B35';
                ctx.lineWidth = 2;
                ctx.strokeText(dmg.value, x, y + offsetY);
                ctx.fillText(dmg.value, x, y + offsetY);
            } else {
                // 普通伤害
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText(dmg.value, x, y + offsetY);
            }

            ctx.restore();
        }
    }

    // 绘制攻击特效
    drawAttackEffect(ctx, entity) {
        const effect = entity.attackEffect;
        if (!effect || !effect.target) return;

        const now = performance.now();
        const progress = (now - effect.startTime) / effect.duration;

        if (progress >= 1) return;

        const startX = entity.position.x;
        const startY = entity.position.y;
        const endX = effect.target.position.x;
        const endY = effect.target.position.y;

        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        ctx.save();

        // 绘制攻击轨迹
        ctx.strokeStyle = entity.team === 0 ? '#3fb950' : '#f85149';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1 - progress;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // 绘制攻击光点
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 绘制军团战斗光环
    drawGroupCombatAura(ctx, x, y, r, entity) {
        const groupSize = entity.combatGroup.length + 1;
        const pulse = Math.sin(performance.now() / 200) * 0.2 + 0.8;

        ctx.save();
        ctx.strokeStyle = entity.team === 0 ? '#3fb950' : '#f85149';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4 * pulse;

        // 外圈光环
        ctx.beginPath();
        ctx.arc(x, y, r + 8 + groupSize * 2, 0, Math.PI * 2);
        ctx.stroke();

        // 内圈光环
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        // 军团人数标记
        ctx.fillStyle = entity.team === 0 ? '#3fb950' : '#f85149';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;
        ctx.fillText(`x${groupSize}`, x, y - r - 12);

        ctx.restore();
    }

    // 绘制英雄 - 六边形+光环
    drawHero(ctx, x, y, r, entity) {
        const teamColor = entity.team === 0 ? '#3fb950' : '#f85149';
        const innerColor = entity.team === 0 ? '#2ea043' : '#da3633';

        // 战斗状态特效
        if (entity.isInCombat) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(x, y, r + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // 外圈光环
        ctx.fillStyle = teamColor;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 2;
            const px = x + Math.cos(angle) * (r + 4);
            const py = y + Math.sin(angle) * (r + 4);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // 六边形主体
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 2;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // 边框
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 内部装饰 - 菱形
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.4);
        ctx.lineTo(x + r * 0.3, y);
        ctx.lineTo(x, y + r * 0.4);
        ctx.lineTo(x - r * 0.3, y);
        ctx.closePath();
        ctx.fill();

        // 英雄标识
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', x, y + 3);
    }

    // 绘制近战兵 - 圆形+盾牌
    drawMelee(ctx, x, y, r, entity) {
        const teamColor = entity.team === 0 ? '#3fb950' : '#f85149';
        const innerColor = entity.team === 0 ? '#2ea043' : '#da3633';

        // 战斗状态特效
        if (entity.isInCombat) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(x, y, r + 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // 主体圆形
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // 边框
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 盾牌形状装饰
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.5);
        ctx.lineTo(x + r * 0.4, y - r * 0.2);
        ctx.lineTo(x + r * 0.4, y + r * 0.3);
        ctx.lineTo(x, y + r * 0.5);
        ctx.lineTo(x - r * 0.4, y + r * 0.3);
        ctx.lineTo(x - r * 0.4, y - r * 0.2);
        ctx.closePath();
        ctx.fill();

        // 盾牌中心点
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 阵营标识
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(entity.team === 0 ? '友' : '敌', x, y + r * 0.7);
    }

    // 绘制远程兵 - 三角形+箭头
    drawRanged(ctx, x, y, r, entity) {
        const teamColor = entity.team === 0 ? '#58a6ff' : '#f85149';
        const innerColor = entity.team === 0 ? '#1f6feb' : '#da3633';

        // 战斗状态特效
        if (entity.isInCombat) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(x, y, r + 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // 主体三角形
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * 0.9, y + r * 0.6);
        ctx.lineTo(x - r * 0.9, y + r * 0.6);
        ctx.closePath();
        ctx.fill();

        // 边框
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 内部箭头装饰
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.3);
        ctx.lineTo(x + r * 0.3, y + r * 0.2);
        ctx.lineTo(x, y + r * 0.1);
        ctx.lineTo(x - r * 0.3, y + r * 0.2);
        ctx.closePath();
        ctx.fill();

        // 阵营标识
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(entity.team === 0 ? '友' : '敌', x, y + r * 0.9);
    }

    // 绘制坦克 - 方形+护甲
    drawTank(ctx, x, y, r, entity) {
        const teamColor = entity.team === 0 ? '#d29922' : '#f85149';
        const innerColor = entity.team === 0 ? '#b8860b' : '#da3633';

        // 战斗状态特效
        if (entity.isInCombat) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(x, y, r + 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // 主体方形（圆角）
        ctx.fillStyle = innerColor;
        const size = r * 1.4;
        ctx.beginPath();
        ctx.roundRect(x - size / 2, y - size / 2, size, size, r * 0.3);
        ctx.fill();

        // 边框
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 护甲条纹
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y - r * 0.3);
        ctx.lineTo(x + r * 0.5, y - r * 0.3);
        ctx.moveTo(x - r * 0.5, y + r * 0.3);
        ctx.lineTo(x + r * 0.5, y + r * 0.3);
        ctx.stroke();

        // 中心护甲块
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.5);

        // 阵营标识
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(entity.team === 0 ? '友' : '敌', x, y + r * 0.8);
    }

    // 绘制血条
    drawHealthBar(ctx, x, y, r, entity) {
        const hpBarWidth = r * 2.8;
        const hpBarHeight = 5;
        const hpBarY = y - r - 10;

        // 血条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight);

        // 血条边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight);

        // 血条
        const hpPercent = entity.hp / entity.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#3fb950' : hpPercent > 0.25 ? '#d29922' : '#f85149';
        ctx.fillRect(x - hpBarWidth / 2, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
    }

    // 绘制战斗指示
    drawCombatIndicator(ctx, x, y, entity) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(entity.combatTarget.position.x, entity.combatTarget.position.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 战斗标记
        const midX = (x + entity.combatTarget.position.x) / 2;
        const midY = (y + entity.combatTarget.position.y) / 2;
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚔', midX, midY);
    }
}
