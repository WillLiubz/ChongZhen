/**
 * 对象池 - 避免频繁创建/销毁对象
 */
class ObjectPool {
    constructor(factory, reset, initialSize = 10) {
        this.factory = factory;  // 创建对象的工厂函数
        this.reset = reset;      // 重置对象的函数
        this.pool = [];
        this.active = new Set();

        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    acquire() {
        let obj = this.pool.pop();
        if (!obj) {
            obj = this.factory();
        }
        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            this.reset(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        this.active.forEach(obj => {
            this.reset(obj);
            this.pool.push(obj);
        });
        this.active.clear();
    }

    getActiveCount() {
        return this.active.size;
    }
}
