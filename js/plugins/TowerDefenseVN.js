/*:
 * @target MZ
 * @plugindesc Vertical slice tower defense tiếng Việt cho Map001.
 * @author OpenAI
 *
 * @help
 * Map001 là màn chơi mẫu. Chuột: chọn ô và đặt tháp (60 vàng).
 * Enter: bắt đầu đợt tiếp theo. R: chơi lại sau khi kết thúc.
 */
(function() {
    "use strict";

    Input.keyMapper[82] = "tdRestart";

    const TD = {
        width: 816,
        height: 624,
        path: [{x: 60, y: 190}, {x: 260, y: 190}, {x: 260, y: 380},
            {x: 500, y: 380}, {x: 500, y: 210}, {x: 745, y: 210}],
        spots: [{x: 150, y: 290}, {x: 350, y: 210}, {x: 390, y: 470},
            {x: 610, y: 320}, {x: 680, y: 120}],
        waveCount: 5,
        reset: function() {
            this.wave = 0;
            this.gold = 160;
            this.baseHp = 20;
            this.towers = [];
            this.enemies = [];
            this.spawnLeft = 0;
            this.spawnTimer = 0;
            this.waveDelay = 0;
            this.state = "ready";
            this.message = "Hãy đặt tháp rồi nhấn ENTER để gọi đợt 1.";
        },
        start: function(scene) {
            if (this.scene === scene) return;
            this.scene = scene;
            this.reset();
            this.bitmap = new Bitmap(this.width, this.height);
            this.overlay = new Sprite(this.bitmap);
            scene.addChild(this.overlay);
            this.visuals = new Sprite();
            scene.addChild(this.visuals);
            this.spotSprites = [];
            this.towerSprites = [];
            this.enemySprites = [];
            this.baseSprite = this.makeCharacterSprite("!Gate1", 48, 48, 1.6);
            this.baseSprite.x = 742;
            this.baseSprite.y = 185;
            this.visuals.addChild(this.baseSprite);
            this.redraw();
        },
        makeCharacterSprite: function(name, frameWidth, frameHeight, scale) {
            const sprite = new Sprite(ImageManager.loadCharacter(name));
            sprite.anchor.set(0.5, 0.5);
            sprite.setFrame(0, 0, frameWidth, frameHeight);
            sprite.scale.set(scale || 1, scale || 1);
            return sprite;
        },
        clearVisuals: function() {
            this.spotSprites.forEach(s => this.visuals.removeChild(s));
            this.towerSprites.forEach(s => this.visuals.removeChild(s));
            this.enemySprites.forEach(s => this.visuals.removeChild(s));
            this.spotSprites = [];
            this.towerSprites = [];
            this.enemySprites = [];
        },
        refreshVisuals: function() {
            this.clearVisuals();
            this.spots.forEach((s, i) => {
                if (!this.towers.some(t => t.spot === i)) {
                    const marker = this.makeCharacterSprite("!Switch1", 48, 48, 0.65);
                    marker.x = s.x;
                    marker.y = s.y;
                    this.visuals.addChild(marker);
                    this.spotSprites.push(marker);
                }
            });
            this.towers.forEach(t => {
                const tower = this.makeCharacterSprite("!Crystal", 48, 48, 1.05);
                tower.x = t.x;
                tower.y = t.y - 6;
                this.visuals.addChild(tower);
                this.towerSprites.push(tower);
            });
            this.enemies.forEach(e => {
                const enemy = this.makeCharacterSprite("$BigMonster1", 96, 96, 0.52);
                const p = this.enemyPosition(e);
                enemy.x = p.x;
                enemy.y = p.y - 8;
                this.visuals.addChild(enemy);
                this.enemySprites.push(enemy);
            });
        },
        update: function() {
            if (!this.scene) return;
            if (this.state === "playing") this.simulate();
            if (TouchInput.isTriggered()) this.click(TouchInput.x, TouchInput.y);
            if (Input.isTriggered("ok") && (this.state === "ready" || this.state === "between")) {
                this.beginWave();
            }
            if (Input.isTriggered("tdRestart") && (this.state === "victory" || this.state === "defeat")) {
                this.reset();
            }
            this.redraw();
        },
        beginWave: function() {
            if (this.wave >= this.waveCount) return;
            this.wave++;
            this.spawnLeft = 3 + this.wave * 2;
            this.spawnTimer = 0;
            this.state = "playing";
            this.message = "Đợt " + this.wave + " đang tiến đến!";
        },
        click: function(x, y) {
            if (this.state === "victory" || this.state === "defeat") return;
            for (let i = 0; i < this.spots.length; i++) {
                const s = this.spots[i];
                if (Math.hypot(x - s.x, y - s.y) < 25 &&
                    !this.towers.some(t => t.spot === i)) {
                    if (this.gold < 60) {
                        this.message = "Chưa đủ vàng (cần 60).";
                    } else {
                        this.gold -= 60;
                        this.towers.push({spot: i, x: s.x, y: s.y, cooldown: 0});
                        this.message = "Đã xây Tháp canh.";
                    }
                    return;
                }
            }
        },
        simulate: function() {
            if (this.spawnLeft > 0 && this.spawnTimer-- <= 0) {
                this.enemies.push({path: 0, progress: 0, hp: 24 + this.wave * 8,
                    maxHp: 24 + this.wave * 8, speed: 0.85 + this.wave * 0.08});
                this.spawnLeft--;
                this.spawnTimer = 38;
            }
            this.enemies.forEach(e => e.progress += e.speed);
            this.towers.forEach(t => {
                if (t.cooldown > 0) t.cooldown--;
                if (t.cooldown > 0) return;
                const target = this.enemies.filter(e => e.hp > 0).sort((a, b) =>
                    (b.path * 1000 + b.progress) - (a.path * 1000 + a.progress))[0];
                if (target && this.distanceToTower(t, target) <= 150) {
                    target.hp -= 12;
                    t.cooldown = 28;
                    if (target.hp <= 0) this.gold += 20;
                }
            });
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                if (e.hp <= 0) {
                    this.enemies.splice(i, 1);
                } else if (e.progress >= 100) {
                    e.progress -= 100;
                    e.path++;
                    if (e.path >= this.path.length - 1) {
                        this.enemies.splice(i, 1);
                        this.baseHp -= 1;
                    }
                }
            }
            if (this.baseHp <= 0) {
                this.state = "defeat";
                this.message = "Căn cứ đã bị phá! Nhấn R để chơi lại.";
            } else if (this.spawnLeft === 0 && this.enemies.length === 0) {
                if (this.wave >= this.waveCount) {
                    this.state = "victory";
                    this.message = "CHIẾN THẮNG! Bạn đã bảo vệ thành trì.";
                } else {
                    this.state = "between";
                    this.waveDelay = 45;
                    this.message = "Đợt " + this.wave + " đã bị đẩy lùi. Nhấn ENTER.";
                }
            }
        },
        distanceToTower: function(t, e) {
            const p = this.enemyPosition(e);
            return Math.hypot(t.x - p.x, t.y - p.y);
        },
        enemyPosition: function(e) {
            const a = this.path[Math.min(e.path, this.path.length - 2)];
            const b = this.path[Math.min(e.path + 1, this.path.length - 1)];
            const r = e.progress / 100;
            return {x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r};
        },
        text: function(text, x, y, size, color, align) {
            this.bitmap.fontSize = size || 18;
            this.bitmap.textColor = color || "#ffffff";
            this.bitmap.outlineColor = "#111827";
            this.bitmap.outlineWidth = 4;
            this.bitmap.drawText(text, x, y, 400, size + 8, align || "left");
        },
        redraw: function() {
            const b = this.bitmap;
            b.clear();
            this.refreshVisuals();
            b.paintOpacity = 205;
            b.fillRect(0, 0, this.width, 82, "#111827");
            b.paintOpacity = 160;
            b.fillRect(0, 520, this.width, 104, "#111827");
            b.paintOpacity = 255;
            b.fillRect(0, 0, 8, this.height, "#f59e0b");
            b.paintOpacity = 120;
            for (let i = 0; i < this.path.length - 1; i++) {
                const a = this.path[i], c = this.path[i + 1];
                b.lineWidth = 32;
                b.paintOpacity = 180;
                b.strokeRect(Math.min(a.x, c.x) - 16, Math.min(a.y, c.y) - 16,
                    Math.abs(c.x - a.x) + 32, Math.abs(c.y - a.y) + 32, "#78350f");
            }
            b.paintOpacity = 255;
            this.spots.forEach((s, i) => {
                b.paintOpacity = 110;
                if (!this.towers.some(t => t.spot === i)) {
                    b.drawCircle(s.x, s.y, 25, "#93c5fd");
                }
            });
            this.towers.forEach(t => {
                b.paintOpacity = 35;
                b.drawCircle(t.x, t.y, 150, "#60a5fa");
            });
            this.enemies.forEach(e => {
                const p = this.enemyPosition(e);
                b.paintOpacity = 255;
                b.fillRect(p.x - 16, p.y - 22, 32, 4, "#111827");
                b.fillRect(p.x - 16, p.y - 22, 32 * Math.max(0, e.hp / e.maxHp), 4, "#22c55e");
            });
            b.paintOpacity = 255;
            this.text("THÀNH TRÌ BÌNH MINH", 22, 30, 24, "#fde68a");
            this.text("Đợt: " + this.wave + "/" + this.waveCount, 360, 28, 20);
            this.text("Căn cứ: " + this.baseHp + "  |  Vàng: " + this.gold, 570, 28, 18, "#fef3c7");
            this.text("Mỗi tháp 60 vàng • Tầm bắn 150 • Click ô xanh để xây", 22, 58, 16, "#bfdbfe");
            this.text(this.message, 22, 554, 20, this.state === "victory" ? "#86efac" : "#ffffff");
            this.text("ENTER: gọi đợt tiếp theo    R: chơi lại khi thắng/thua", 22, 585, 16, "#cbd5e1");
            b.paintOpacity = 255;
            this.text("CĂN CỨ", 688, 270, 14, "#fde68a");
        }
    };

    const _start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _start.call(this);
        if ($gameMap.mapId() === 1) TD.start(this);
    };
    const _update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _update.call(this);
        if ($gameMap.mapId() === 1) TD.update();
    };
})();
