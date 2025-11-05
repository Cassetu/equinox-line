const AudioManager = {
    bgMusic: document.getElementById('bg-music'),
    battleMusic: document.getElementById('battle-music'),
    victoryMusic: document.getElementById('victory-music'),
    musicEnabled: false,
    sfxEnabled: true,
    currentMusic: null,

    init() {
        this.bgMusic.volume = 0.3;
        this.battleMusic.volume = 0.4;
        this.victoryMusic.volume = 0.35;

        document.getElementById('music-btn').onclick = () => this.toggleMusic();
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const btn = document.getElementById('music-btn');

        if (this.musicEnabled) {
            this.playBgMusic();
            btn.textContent = '🔊';
        } else {
            this.stopAllMusic();
            btn.textContent = '🔇';
        }
    },

    playBgMusic() {
        if (!this.musicEnabled) return;
        this.stopAllMusic();
        this.bgMusic.play().catch(e => console.log('Music blocked'));
        this.currentMusic = this.bgMusic;
    },

    playBattleMusic() {
        if (!this.musicEnabled) return;
        this.stopAllMusic();
        this.battleMusic.currentTime = 0;
        this.battleMusic.play().catch(e => console.log('Music blocked'));
        this.currentMusic = this.battleMusic;
    },

    playVictoryMusic() {
        this.stopAllMusic();
        this.victoryMusic.currentTime = 0;
        this.victoryMusic.play().catch(e => console.log('Music blocked'));
        this.currentMusic = this.victoryMusic;
    },

    stopAllMusic() {
        this.bgMusic.pause();
        this.battleMusic.pause();
        this.victoryMusic.pause();
    },

    playSFX(sfxId, volume = 0.5) {
        if (!this.sfxEnabled) return;
        const sfx = document.getElementById(sfxId);
        if (sfx) {
            sfx.volume = volume;
            sfx.currentTime = 0;
            sfx.play().catch(e => console.log('SFX blocked'));
        }
    }
};

AudioManager.init();
