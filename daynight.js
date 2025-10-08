class DayNightCycle {
    constructor(scene) {
        this.scene = scene;

        // 時間設定
        this.dayDuration = 600000; // 10分 = 600秒 = 600,000ミリ秒
        this.currentTime = 0; // 0 = 真夜中, 0.25 = 朝, 0.5 = 正午, 0.75 = 夕方

        // 時間帯の定義
        this.phases = {
            NIGHT: { start: 0.0, end: 0.2 },
            SUNRISE: { start: 0.2, end: 0.3 },
            DAY: { start: 0.3, end: 0.7 },
            SUNSET: { start: 0.7, end: 0.8 },
            NIGHT_START: { start: 0.8, end: 1.0 }
        };

        // ライト設定
        this.setupLights();

        // 初期時刻を正午に設定
        this.currentTime = 0.5;
    }

    setupLights() {
        // 環境光
        this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        this.scene.add(this.ambientLight);

        // 太陽光（ディレクショナルライト）
        this.sunLight = new THREE.DirectionalLight(0xFFFFDD, 0.8);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = false; // パフォーマンスのため影は無効
        this.scene.add(this.sunLight);

        // 月光
        this.moonLight = new THREE.DirectionalLight(0x6666AA, 0.2);
        this.moonLight.position.set(-50, 50, -50);
        this.moonLight.castShadow = false;
        this.scene.add(this.moonLight);

        // フォグ（霧）- パフォーマンス最適化で短縮
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 80);
    }

    update(deltaTime) {
        // 時間を進める
        this.currentTime += (deltaTime / this.dayDuration);
        if (this.currentTime >= 1.0) {
            this.currentTime = 0.0;
        }

        // ライトと空の色を更新
        this.updateLighting();
        this.updateSkyColor();
    }

    updateLighting() {
        const time = this.currentTime;

        // 太陽の位置（円軌道）
        const sunAngle = (time - 0.25) * Math.PI * 2;
        const sunHeight = Math.sin(sunAngle);
        const sunX = Math.cos(sunAngle);

        this.sunLight.position.set(sunX * 100, sunHeight * 100, 50);

        // 月の位置（太陽の反対側）
        const moonAngle = sunAngle + Math.PI;
        const moonHeight = Math.sin(moonAngle);
        const moonX = Math.cos(moonAngle);

        this.moonLight.position.set(moonX * 100, moonHeight * 100, -50);

        // 時間帯によって光の強度を変更
        if (this.isNight()) {
            // 夜
            this.ambientLight.intensity = 0.3;
            this.sunLight.intensity = 0;
            this.moonLight.intensity = 0.2;
        } else if (this.isSunrise() || this.isSunset()) {
            // 朝夕
            const transition = this.isSunrise() ?
                (time - this.phases.SUNRISE.start) / (this.phases.SUNRISE.end - this.phases.SUNRISE.start) :
                1 - (time - this.phases.SUNSET.start) / (this.phases.SUNSET.end - this.phases.SUNSET.start);

            this.ambientLight.intensity = 0.3 + transition * 0.3;
            this.sunLight.intensity = transition * 0.8;
            this.moonLight.intensity = (1 - transition) * 0.2;
        } else {
            // 昼
            this.ambientLight.intensity = 0.6;
            this.sunLight.intensity = 0.8;
            this.moonLight.intensity = 0;
        }
    }

    updateSkyColor() {
        const time = this.currentTime;
        let skyColor;

        if (this.isNight()) {
            // 夜 - 濃い青
            skyColor = new THREE.Color(0x001133);
        } else if (this.isSunrise()) {
            // 朝 - オレンジから水色へ
            const t = (time - this.phases.SUNRISE.start) / (this.phases.SUNRISE.end - this.phases.SUNRISE.start);
            skyColor = new THREE.Color().lerpColors(
                new THREE.Color(0xFF6633),
                new THREE.Color(0x87CEEB),
                t
            );
        } else if (this.isSunset()) {
            // 夕方 - 水色からオレンジへ
            const t = (time - this.phases.SUNSET.start) / (this.phases.SUNSET.end - this.phases.SUNSET.start);
            skyColor = new THREE.Color().lerpColors(
                new THREE.Color(0x87CEEB),
                new THREE.Color(0xFF6633),
                t
            );
        } else {
            // 昼 - 水色
            skyColor = new THREE.Color(0x87CEEB);
        }

        this.scene.background = skyColor;
        this.scene.fog.color = skyColor;
    }

    isNight() {
        return (this.currentTime >= this.phases.NIGHT.start && this.currentTime < this.phases.SUNRISE.start) ||
               (this.currentTime >= this.phases.NIGHT_START.start);
    }

    isDay() {
        return this.currentTime >= this.phases.DAY.start && this.currentTime < this.phases.SUNSET.start;
    }

    isSunrise() {
        return this.currentTime >= this.phases.SUNRISE.start && this.currentTime < this.phases.SUNRISE.end;
    }

    isSunset() {
        return this.currentTime >= this.phases.SUNSET.start && this.currentTime < this.phases.SUNSET.end;
    }

    getTimeString() {
        if (this.isNight()) return '夜';
        if (this.isSunrise()) return '朝';
        if (this.isSunset()) return '夕方';
        if (this.isDay()) {
            if (this.currentTime < 0.5) return '午前';
            return '午後';
        }
        return '正午';
    }

    setToNoon() {
        this.currentTime = 0.5;
    }

    setToMidnight() {
        this.currentTime = 0.0;
    }

    setToSunrise() {
        this.currentTime = 0.25;
    }

    setToSunset() {
        this.currentTime = 0.75;
    }

    getTimeOfDay() {
        return this.currentTime;
    }
}

window.DayNightCycle = DayNightCycle;
