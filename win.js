const VictoryConditions = {
    economicTarget: 50000,
    diplomaticYearsNeeded: 10,
    diplomaticYearsCount: 0,
    lastRepCheck: 0,

    conditions: {
        peaceful: {
            name: 'Peaceful Evacuation',
            icon: '🚀',
            description: 'Build the Spaceport and evacuate to a stable planet',
            getProgress: () => game.spaceportProgress,
            getProgressText: () => `${Math.floor(game.spaceportProgress)}%`,
            check: () => game.spaceportProgress >= 100
        },
        domination: {
            name: 'Total Domination',
            icon: '⚔️',
            description: 'Conquer all tribal cities',
            getProgress: () => {
                const total = game.tribalCities.length;
                const conquered = game.tribalCities.filter(t => t.isConverted).length;
                return total > 0 ? (conquered / total) * 100 : 0;
            },
            getProgressText: () => {
                const total = game.tribalCities.length;
                const conquered = game.tribalCities.filter(t => t.isConverted).length;
                return `${conquered}/${total} cities`;
            },
            check: () => game.tribalsDefeated
        },
        diplomatic: {
            name: 'Diplomatic Victory',
            icon: '🤝',
            description: 'Maintain 100 reputation with tribals for 10 years',
            getProgress: () => (VictoryConditions.diplomaticYearsCount / VictoryConditions.diplomaticYearsNeeded) * 100,
            getProgressText: () => `${VictoryConditions.diplomaticYearsCount}/${VictoryConditions.diplomaticYearsNeeded} years`,
            check: () => {
                if (game.tribalReputation >= 100) {
                    if (Math.floor(game.year) > VictoryConditions.lastRepCheck) {
                        VictoryConditions.diplomaticYearsCount++;
                        VictoryConditions.lastRepCheck = Math.floor(game.year);
                    }
                } else {
                    VictoryConditions.diplomaticYearsCount = 0;
                }
                return VictoryConditions.diplomaticYearsCount >= VictoryConditions.diplomaticYearsNeeded;
            }
        },
        economic: {
            name: 'Economic Supremacy',
            icon: '💰',
            description: 'Accumulate 50,000 total resources',
            getProgress: () => {
                const total = game.resources.food + game.resources.metal + game.resources.energy;
                return Math.min(100, (total / VictoryConditions.economicTarget) * 100);
            },
            getProgressText: () => {
                const total = Math.floor(game.resources.food + game.resources.metal + game.resources.energy);
                return `${total.toLocaleString()}/${VictoryConditions.economicTarget.toLocaleString()}`;
            },
            check: () => {
                const total = game.resources.food + game.resources.metal + game.resources.energy;
                return total >= VictoryConditions.economicTarget;
            }
        }
    },

    init() {
        this.createVictoryButton();
        this.createProgressPanel();
    },

    createVictoryButton() {
        const btn = document.createElement('button');
        btn.id = 'victory-conditions-btn';
        btn.textContent = 'Victory';
        btn.onclick = () => this.togglePanel();

        const controls = document.getElementById('controls');
        const techBtn = document.getElementById('tech-tree-btn');
        controls.insertBefore(btn, techBtn);
    },

    createProgressPanel() {
        const panel = document.createElement('div');
        panel.id = 'victory-progress-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <div class="victory-panel-content">
                <div class="victory-panel-header">
                    <h2>VICTORY CONDITIONS</h2>
                    <button id="close-victory-panel">✕</button>
                </div>
                <div id="victory-conditions-list"></div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('close-victory-panel').onclick = () => this.togglePanel();
        this.updateProgressDisplay();
    },

    togglePanel() {
        const panel = document.getElementById('victory-progress-panel');
        const isOpen = panel.style.display === 'flex';
        panel.style.display = isOpen ? 'none' : 'flex';

        if (!isOpen) {
            game.paused = true;
            this.updateProgressDisplay();
        } else {
            game.paused = false;
        }

        AudioManager.playSFX('sfx-button-click', 0.4);
    },

    updateProgressDisplay() {
        const container = document.getElementById('victory-conditions-list');
        if (!container) return;

        container.innerHTML = '';
        Object.keys(this.conditions).forEach(key => {
            const condition = this.conditions[key];
            const progress = condition.getProgress();
            const progressText = condition.getProgressText();

            const item = document.createElement('div');
            item.className = 'victory-condition-item';
            item.innerHTML = `
                <div class="victory-condition-header">
                    <span class="victory-condition-icon">${condition.icon}</span>
                    <div class="victory-condition-info">
                        <div class="victory-condition-name">${condition.name}</div>
                        <div class="victory-condition-desc">${condition.description}</div>
                    </div>
                </div>
                <div class="victory-progress-container">
                    <div class="victory-progress-bar">
                        <div class="victory-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="victory-progress-text">${progressText}</div>
                </div>
            `;
            container.appendChild(item);
        });
    },

    checkVictory() {
        if (!game.running) return;

        Object.keys(this.conditions).forEach(key => {
            const condition = this.conditions[key];
            if (condition.check()) {
                this.triggerVictory(key);
            }
        });
    },

    triggerVictory(conditionKey) {
        const condition = this.conditions[conditionKey];
        game.running = false;
        clearInterval(gameLoop);
        AudioManager.playVictoryMusic();

        const panel = document.getElementById('game-over');
        panel.className = 'victory';
        const totalPop = game.cities.reduce((sum, c) => sum + Math.floor(c.population), 0);

        document.getElementById('game-over-msg').innerHTML = `
            <p style="font-size: 18px; margin: 20px 0;">${condition.icon} ${condition.name}!</p>
            <p><strong>Statistics:</strong></p>
            <p>Cities: ${game.cities.length}</p>
            <p>Population: ${totalPop}</p>
            <p>Years: ${Math.floor(game.year)}</p>
            <p>Resources: ${Math.floor(game.resources.food + game.resources.metal + game.resources.energy)}</p>
            <p style="margin-top: 20px; color: #00ff00;">VICTORY!</p>
        `;
        panel.querySelector('h2').textContent = 'Victory Achieved!';
        panel.style.display = 'block';
    }
};