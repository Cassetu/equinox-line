const AudioManager = {
    bgMusic: null,
    battleMusic: document.getElementById('battle-music'),
    victoryMusic: document.getElementById('victory-music'),
    musicEnabled: false,
    sfxEnabled: true,
    currentMusic: null,
    currentTrackIndex: 0,
    isLooping: true,
    musicTracks: [
        { name: 'The Awakening', url: 'music/awaken.mp3' },
        { name: 'New Beginnings', url: 'music/new.mp3' },
        { name: 'Tesseract', url: 'music/tesseract.mp3' },
        { name: 'Terraforming', url: 'music/terraforming.mp3' },
        { name: 'First Contact', url: 'music/contact.mp3' },
        { name: 'Solar Sail', url: 'music/solar_sail.mp3' },
        { name: 'Galaxy', url: 'music/galaxy.mp3' },
        { name: 'Aphelion', url: 'music/aphelion.mp3' },
        { name: 'Lagrange Point', url: 'music/point.mp3' }
    ],

    init() {
        this.bgMusic = new Audio(this.musicTracks[0].url);
        this.bgMusic.volume = 0.3;
        this.battleMusic.volume = 0.4;
        this.victoryMusic.volume = 0.35;

        this.bgMusic.addEventListener('ended', () => {
            if (this.isLooping) {
                this.bgMusic.currentTime = 0;
                this.bgMusic.play();
            } else {
                this.nextTrack();
            }
        });

        document.getElementById('music-btn').onclick = () => this.toggleMusicMenu();
        document.getElementById('sfx-toggle-btn').onclick = () => this.toggleSFX();
        this.createMusicMenu();
    },

    createMusicMenu() {
        const menu = document.createElement('div');
        menu.id = 'music-menu';
        menu.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 300px;
            max-height: 500px;
            background: rgba(238,217,196,0.95);
            border: 2px solid #8b4f2f;
            border-radius: 10px;
            padding: 15px;
            z-index: 10001;
            display: none;
            overflow-y: auto;
        `;

        menu.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 15px;">
                <img id="album-cover" src="" alt="Album Cover" style="
                    width: 100%;
                    height: 250px;
                    object-fit: cover;
                    border: 2px solid #8b4f2f;
                    margin-bottom: 10px;
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                ">
                <h3 style="color: #8b4f2f; margin: 0; font-size: 14px;">Music Player</h3>
            </div>
            <div style="margin-bottom: 15px;">
                <button id="music-toggle-btn" style="width: 100%; margin-bottom: 5px;">Enable Music</button>
                <label style="display: flex; align-items: center; gap: 5px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" id="loop-toggle" checked style="cursor: pointer;">
                    Loop Current Track
                </label>
            </div>
            <div style="margin-bottom: 10px;">
                <div id="current-track" style="font-size: 12px; color: #ffaa00; margin-bottom: 5px;">No track playing</div>
                <div style="display: flex; gap: 5px;">
                    <button id="prev-track-btn" style="flex: 1;">◀</button>
                    <button id="next-track-btn" style="flex: 1;">▶</button>
                </div>
            </div>
            <div id="track-list"></div>
        `;

        document.body.appendChild(menu);

        document.getElementById('music-toggle-btn').onclick = () => this.toggleMusic();
        document.getElementById('loop-toggle').onchange = (e) => this.isLooping = e.target.checked;
        document.getElementById('prev-track-btn').onclick = () => this.prevTrack();
        document.getElementById('next-track-btn').onclick = () => this.nextTrack();

        this.updateTrackList();
    },

    updateTrackList() {
        const trackList = document.getElementById('track-list');
        trackList.innerHTML = '';

        this.musicTracks.forEach((track, index) => {
            const trackBtn = document.createElement('button');
            trackBtn.textContent = track.name;
            trackBtn.style.cssText = `
                width: 100%;
                margin: 3px 0;
                padding: 8px;
                font-size: 11px;
                text-align: left;
                background: ${index === this.currentTrackIndex ? 'rgba(55, 55, 55, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
                border: 1px solid ${index === this.currentTrackIndex ? '#8b4f2f' : 'rgba(255, 255, 255, 0.3)'};
            `;
            trackBtn.onclick = () => this.selectTrack(index);
            trackList.appendChild(trackBtn);
        });
    },

    toggleMusicMenu() {
        const menu = document.getElementById('music-menu');
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const btn = document.getElementById('music-toggle-btn');
        const mainBtn = document.getElementById('music-btn');

        if (this.musicEnabled) {
            this.playBgMusic();
            btn.textContent = 'Disable Music';
            mainBtn.textContent = '🔊';
        } else {
            this.stopAllMusic();
            btn.textContent = 'Enable Music';
            mainBtn.textContent = '🔇';
        }
    },

    selectTrack(index) {
        this.currentTrackIndex = index;
        const track = this.musicTracks[index];

        this.bgMusic.pause();
        this.bgMusic.src = track.url;
        this.bgMusic.currentTime = 0;

        if (this.musicEnabled) {
            this.bgMusic.play().catch(e => console.log('Music blocked'));
            this.currentMusic = this.bgMusic;
        }

        document.getElementById('current-track').textContent = `Now Playing: ${track.name}`;
        this.updateTrackList();
    },

    nextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
        this.selectTrack(this.currentTrackIndex);
    },

    prevTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.musicTracks.length) % this.musicTracks.length;
        this.selectTrack(this.currentTrackIndex);
    },

    playBgMusic() {
        if (!this.musicEnabled) return;
        this.stopAllMusic();
        this.bgMusic.play().catch(e => console.log('Music blocked'));
        this.currentMusic = this.bgMusic;
        const track = this.musicTracks[this.currentTrackIndex];
        document.getElementById('current-track').textContent = `Now Playing: ${track.name}`;
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
    },

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        const btn = document.getElementById('sfx-toggle-btn');

        if (this.sfxEnabled) {
            btn.textContent = '🔊 SFX: ON';
            btn.style.background = 'rgba(55, 55, 55, 0.2)';
            btn.style.borderColor = '#8b4f2f';
        } else {
            btn.textContent = '🔇 SFX: OFF';
            btn.style.background = 'rgba(55, 55, 55, 0.2)';
            btn.style.borderColor = '#8b4f2f';
        }

        this.playSFX('sfx-button-click', 0.3);
    },

    setAlbumCover(imageUrl) {
        const albumCover = document.getElementById('album-cover');
        if (albumCover) {
            if (imageUrl) {
                albumCover.src = imageUrl;
                albumCover.style.display = 'block';
            } else {
                albumCover.style.display = 'none';
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AudioManager.init();
    AudioManager.setAlbumCover('images/cover.jpg');
});