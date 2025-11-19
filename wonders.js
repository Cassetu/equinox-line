const WONDERS = {
    greatLibrary: {
        name: 'Great Library',
        icon: '📚',
        description: 'Repository of all knowledge',
        effect: 'Doubles research point generation',
        cost: { food: 1000, metal: 800, energy: 600 },
        buildTime: 500,
        bonus: { type: 'research', value: 1.0 },
        color: '#4169E1'
    },
    planetaryDefense: {
        name: 'Planetary Defense Grid',
        icon: '🛡️',
        description: 'Advanced defensive network',
        effect: '+25% defense to all cities',
        cost: { food: 800, metal: 1500, energy: 1000 },
        buildTime: 600,
        bonus: { type: 'cityDefense', value: 0.25 },
        color: '#32CD32'
    },
    grandArchive: {
        name: 'Grand Archive',
        icon: '🗂️',
        description: 'Intelligence headquarters',
        effect: 'Reveals all tribal forces permanently',
        cost: { food: 600, metal: 600, energy: 800 },
        buildTime: 400,
        bonus: { type: 'reveal', value: true },
        color: '#9370DB'
    },
    monumentOfUnity: {
        name: 'Monument of Unity',
        icon: '🗿',
        description: 'Symbol of civilization',
        effect: '+15 happiness/year to all cities',
        cost: { food: 1200, metal: 1000, energy: 400 },
        buildTime: 700,
        bonus: { type: 'happiness', value: 15 },
        color: '#FFD700'
    },
    megaFactory: {
        name: 'Mega Factory',
        icon: '🏭',
        description: 'Industrial powerhouse',
        effect: '+30% metal and energy production',
        cost: { food: 500, metal: 2000, energy: 1500 },
        buildTime: 800,
        bonus: { type: 'production', value: 0.30 },
        color: '#FF6347'
    },
    gardenOfLife: {
        name: 'Garden of Life',
        icon: '🌺',
        description: 'Agricultural wonder',
        effect: '+40% food production and +20% population growth',
        cost: { food: 1500, metal: 600, energy: 400 },
        buildTime: 600,
        bonus: { type: 'agriculture', foodValue: 0.40, growthValue: 0.20 },
        color: '#00FF7F'
    },
    commandCenter: {
        name: 'Supreme Command',
        icon: '⭐',
        description: 'Military coordination hub',
        effect: '+20% attack for all units, units cost 20% less',
        cost: { food: 1000, metal: 1200, energy: 800 },
        buildTime: 700,
        bonus: { type: 'military', attackValue: 0.20, costValue: 0.20 },
        color: '#DC143C'
    },
    cosmicBeacon: {
        name: 'Cosmic Beacon',
        icon: '🌟',
        description: 'Signal to the stars',
        effect: 'Spaceport construction 50% faster',
        cost: { food: 800, metal: 1000, energy: 1800 },
        buildTime: 500,
        bonus: { type: 'spaceport', value: 0.50 },
        color: '#00CED1'
    }
};

const WonderSystem = {
    builtWonders: [],
    wondersInProgress: [],
    placingWonder: null,

    init() {
        this.createWonderButton();
        this.createWonderPanel();
    },

    createWonderButton() {
        const btn = document.createElement('button');
        btn.id = 'wonders-btn';
        btn.textContent = 'Wonders';
        btn.onclick = () => this.toggleWonderPanel();

        const controls = document.getElementById('controls');
        const spaceportBtn = document.getElementById('spaceport-btn');
        controls.insertBefore(btn, spaceportBtn);
    },

    createWonderPanel() {
        const panel = document.createElement('div');
        panel.id = 'wonders-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(180deg, #f5e6d3 0%, #e8d4b0 50%, #d4c0a0 100%);
            border: 4px double #8b6f47;
            border-radius: 15px;
            padding: 30px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 9999;
            display: none;
            box-shadow: inset 0 0 40px rgba(139, 111, 71, 0.3), 0 10px 50px rgba(0, 0, 0, 0.6);
        `;
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #8b4f2f; margin: 0;">WONDERS OF THE WORLD</h2>
                <button id="close-wonders-panel" style="width: 40px; height: 40px; font-size: 24px;">✕</button>
            </div>
            <div id="wonders-list"></div>
        `;
        document.body.appendChild(panel);

        document.getElementById('close-wonders-panel').onclick = () => this.toggleWonderPanel();
        this.updateWonderList();
    },

    toggleWonderPanel() {
        const panel = document.getElementById('wonders-panel');
        const isOpen = panel.style.display === 'block';
        panel.style.display = isOpen ? 'none' : 'block';

        if (!isOpen) {
            game.paused = true;
            this.updateWonderList();
        } else {
            game.paused = false;
        }

        AudioManager.playSFX('sfx-button-click', 0.4);
    },

    updateWonderList() {
        const container = document.getElementById('wonders-list');
        if (!container) return;

        container.innerHTML = '';

        Object.keys(WONDERS).forEach(wonderKey => {
            const wonder = WONDERS[wonderKey];
            const isBuilt = this.builtWonders.includes(wonderKey);
            const inProgress = this.wondersInProgress.find(w => w.key === wonderKey);

            const item = document.createElement('div');
            item.style.cssText = `
                background: linear-gradient(to bottom, #f5e6d3, #e8d4b0);
                border: 3px double #8b6f47;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(139, 111, 71, 0.1);
                ${isBuilt ? 'opacity: 0.6;' : ''}
            `;

            let statusText = '';
            let buttonHTML = '';

            if (isBuilt) {
                statusText = '<div style="color: #00ff00; font-weight: bold; margin-top: 10px;">✓ COMPLETED</div>';
            } else if (inProgress) {
                const progress = (inProgress.progress / wonder.buildTime) * 100;
                const yearsLeft = Math.ceil((wonder.buildTime - inProgress.progress) / 100);
                statusText = `
                    <div style="margin-top: 10px;">
                        <div style="color: #FFD700; font-size: 12px; margin-bottom: 5px;">
                            Building... ${yearsLeft} years remaining
                        </div>
                        <div style="width: 100%; height: 20px; background: rgba(0,0,0,0.5); border: 2px solid ${wonder.color}; border-radius: 5px; overflow: hidden;">
                            <div style="width: ${progress}%; height: 100%; background: ${wonder.color}; transition: width 0.3s;"></div>
                        </div>
                    </div>
                `;
            } else {
                const canAfford = hasResources(wonder.cost);
                buttonHTML = `
                    <button
                        onclick="WonderSystem.startWonderPlacement('${wonderKey}')"
                        ${!canAfford ? 'disabled' : ''}
                        style="margin-top: 10px; width: 100%; padding: 8px; background: ${wonder.color}; color: #000; font-weight: bold; border: 2px solid #fff; cursor: ${canAfford ? 'pointer' : 'not-allowed'};">
                        Build Wonder (${wonder.cost.food}F, ${wonder.cost.metal}M, ${wonder.cost.energy}E)
                    </button>
                `;
            }

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                    <div style="font-size: 48px;">${wonder.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 18px; font-weight: bold; color: ${wonder.color};">${wonder.name}</div>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 3px;">${wonder.description}</div>
                    </div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <div style="font-size: 13px; color: #8b4f2f;"><strong>Effect:</strong> ${wonder.effect}</div>
                    <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">Build time: ${Math.floor(wonder.buildTime / 100)} years</div>
                </div>
                ${statusText}
                ${buttonHTML}
            `;

            container.appendChild(item);
        });
    },

    startWonderPlacement(wonderKey) {
        const wonder = WONDERS[wonderKey];
        if (!hasResources(wonder.cost)) {
            addMessage('Not enough resources!', 'warning');
            return;
        }

        if (game.cities.length === 0) {
            addMessage('You need at least one city to build a wonder!', 'warning');
            return;
        }

        this.placingWonder = wonderKey;
        game.placingCity = false;
        game.buildingRoad = false;
        game.roadStartCity = null;

        document.getElementById('planet-view').classList.add('placing-city');
        document.getElementById('wonders-panel').style.display = 'none';
        game.paused = false;

        addMessage(`Place ${wonder.name} near one of your cities (within 15% range)`, 'info');
    },

    canPlaceWonderAt(x, y) {
        const nearbyCity = game.cities.find(city => {
            const distance = Math.sqrt(Math.pow(x - city.x, 2) + Math.pow(y - city.y, 2));
            return distance < 15 && !city.isRebel;
        });

        if (!nearbyCity) return false;

        const tooCloseToOther = this.builtWonders.some(wonderKey => {
            const wonder = game.wonderLocations.find(w => w.key === wonderKey);
            if (!wonder) return false;
            const distance = Math.sqrt(Math.pow(x - wonder.x, 2) + Math.pow(y - wonder.y, 2));
            return distance < 8;
        });

        return !tooCloseToOther;
    },

    placeWonder(x, y) {
        const wonderKey = this.placingWonder;
        const wonder = WONDERS[wonderKey];

        if (!this.canPlaceWonderAt(x, y)) {
            addMessage('Must be near a city and away from other wonders!', 'warning');
            return;
        }

        spendResources(wonder.cost);

        const wonderData = {
            key: wonderKey,
            x, y,
            progress: 0,
            isConnected: false
        };

        this.wondersInProgress.push(wonderData);
        game.wonderLocations.push({ key: wonderKey, x, y });

        this.createWonderElement(wonderKey, x, y);

        addMessage(`${wonder.name} construction started!`, 'success');
        AudioManager.playSFX('sfx-city-build', 0.7);

        this.placingWonder = null;
        document.getElementById('planet-view').classList.remove('placing-city');
    },

    createWonderElement(wonderKey, x, y) {
        const wonder = WONDERS[wonderKey];
        const el = document.createElement('div');
        el.className = 'wonder';
        el.id = `wonder-${wonderKey}`;
        el.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            z-index: 22;
            cursor: pointer;
            transition: all 0.3s;
        `;

        let wonderShape = '';

        switch(wonderKey) {
            case 'greatLibrary':
                wonderShape = `
                    <div class="wonder-library">
                        <div class="library-base"></div>
                        <div class="library-pillar" style="left: 10px;"></div>
                        <div class="library-pillar" style="left: 30px;"></div>
                        <div class="library-pillar" style="left: 50px;"></div>
                        <div class="library-roof"></div>
                        <div class="library-glow"></div>
                    </div>
                `;
                break;

            case 'planetaryDefense':
                wonderShape = `
                    <div class="wonder-defense">
                        <div class="defense-shield"></div>
                        <div class="defense-ring ring-1"></div>
                        <div class="defense-ring ring-2"></div>
                        <div class="defense-ring ring-3"></div>
                        <div class="defense-core"></div>
                    </div>
                `;
                break;

            case 'grandArchive':
                wonderShape = `
                    <div class="wonder-archive">
                        <div class="archive-tower tower-1"></div>
                        <div class="archive-tower tower-2"></div>
                        <div class="archive-tower tower-3"></div>
                        <div class="archive-beam"></div>
                        <div class="archive-data data-1"></div>
                        <div class="archive-data data-2"></div>
                        <div class="archive-data data-3"></div>
                    </div>
                `;
                break;

            case 'monumentOfUnity':
                wonderShape = `
                    <div class="wonder-monument">
                        <div class="monument-base"></div>
                        <div class="monument-middle"></div>
                        <div class="monument-top"></div>
                        <div class="monument-crystal"></div>
                        <div class="monument-glow"></div>
                    </div>
                `;
                break;

            case 'megaFactory':
                wonderShape = `
                    <div class="wonder-factory">
                        <div class="factory-body"></div>
                        <div class="factory-chimney chimney-1"></div>
                        <div class="factory-chimney chimney-2"></div>
                        <div class="factory-smoke smoke-1"></div>
                        <div class="factory-smoke smoke-2"></div>
                        <div class="factory-gear gear-1"></div>
                        <div class="factory-gear gear-2"></div>
                    </div>
                `;
                break;

            case 'gardenOfLife':
                wonderShape = `
                    <div class="wonder-garden">
                        <div class="garden-dome"></div>
                        <div class="garden-petal petal-1"></div>
                        <div class="garden-petal petal-2"></div>
                        <div class="garden-petal petal-3"></div>
                        <div class="garden-petal petal-4"></div>
                        <div class="garden-center"></div>
                        <div class="garden-particle particle-1"></div>
                        <div class="garden-particle particle-2"></div>
                        <div class="garden-particle particle-3"></div>
                    </div>
                `;
                break;

            case 'commandCenter':
                wonderShape = `
                    <div class="wonder-command">
                        <div class="command-base"></div>
                        <div class="command-dish"></div>
                        <div class="command-radar"></div>
                        <div class="command-signal signal-1"></div>
                        <div class="command-signal signal-2"></div>
                        <div class="command-signal signal-3"></div>
                    </div>
                `;
                break;

            case 'cosmicBeacon':
                wonderShape = `
                    <div class="wonder-beacon">
                        <div class="beacon-base"></div>
                        <div class="beacon-tower"></div>
                        <div class="beacon-light"></div>
                        <div class="beacon-ray ray-1"></div>
                        <div class="beacon-ray ray-2"></div>
                        <div class="beacon-ray ray-3"></div>
                        <div class="beacon-star star-1"></div>
                        <div class="beacon-star star-2"></div>
                        <div class="beacon-star star-3"></div>
                    </div>
                `;
                break;
        }

        el.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                position: relative;
            ">
                ${wonderShape}
            </div>
            <div class="wonder-connection-status" style="
                position: absolute;
                top: -10px;
                right: -10px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ff4400;
                border: 2px solid #fff;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            ">
                ⚠️
            </div>
            <div style="
                position: absolute;
                top: -35px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                background: rgba(0,0,0,0.9);
                padding: 4px 10px;
                border-radius: 5px;
                border: 2px solid ${wonder.color};
                box-shadow: 0 0 10px ${wonder.color};
                z-index: 10;
            ">
                ${wonder.name}
            </div>
            <div class="wonder-progress-bar" style="
                position: absolute;
                bottom: -12px;
                left: 50%;
                transform: translateX(-50%);
                width: 90px;
                height: 10px;
                background: rgba(0,0,0,0.9);
                border: 2px solid ${wonder.color};
                border-radius: 5px;
                overflow: hidden;
                z-index: 10;
            ">
                <div class="wonder-progress-fill" style="
                    width: 0%;
                    height: 100%;
                    background: ${wonder.color};
                    transition: width 0.3s;
                    box-shadow: 0 0 10px ${wonder.color};
                "></div>
            </div>
        `;

        el.onclick = (e) => {
            e.stopPropagation();
            this.selectWonder(wonderKey);
        };

        document.getElementById('planet-view').appendChild(el);
    },

    selectWonder(wonderKey) {
        const wonder = WONDERS[wonderKey];
        const isBuilt = this.builtWonders.includes(wonderKey);
        const inProgress = this.wondersInProgress.find(w => w.key === wonderKey);
        const isConnected = this.isWonderConnected(wonderKey);

        const panel = document.getElementById('info-panel');
        let statusHTML = '';

        if (isBuilt) {
            if (isConnected) {
                statusHTML = '<p style="color: #00ff00; font-weight: bold;">✓ COMPLETED & CONNECTED</p>';
            } else {
                statusHTML = '<p style="color: #ffaa00; font-weight: bold;">⚠️ COMPLETED - NOT CONNECTED!</p><p style="font-size: 10px; color: #ff4400;">Build a road to a nearby city to activate bonuses</p>';
            }
        } else if (inProgress) {
            const progress = ((inProgress.progress / wonder.buildTime) * 100).toFixed(1);
            const yearsLeft = Math.ceil((wonder.buildTime - inProgress.progress) / 100);
            statusHTML = `
                <p><strong>Progress:</strong> ${progress}%</p>
                <p><strong>Time Remaining:</strong> ${yearsLeft} years</p>
            `;
        }

        panel.innerHTML = `
            <h3>${wonder.icon} ${wonder.name}</h3>
            <p style="font-size: 11px; opacity: 0.8;">${wonder.description}</p>
            <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 5px; margin: 10px 0;">
                <p style="color: #00ff00;"><strong>Effect:</strong> ${wonder.effect}</p>
                ${isBuilt && !isConnected ? '<p style="color: #ff4400; font-size: 10px; margin-top: 5px;"><strong>⚠️ Effect inactive - needs road connection!</strong></p>' : ''}
            </div>
            ${statusHTML}
        `;
        panel.style.display = 'block';
    },

    updateWonders() {
        this.wondersInProgress.forEach((wonder, index) => {
            wonder.progress += 1;

            const wonderData = WONDERS[wonder.key];
            const progress = (wonder.progress / wonderData.buildTime) * 100;

            const el = document.getElementById(`wonder-${wonder.key}`);
            if (el) {
                const progressBar = el.querySelector('.wonder-progress-fill');
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            }

            if (wonder.progress >= wonderData.buildTime) {
                this.completeWonder(wonder.key, index);
            }
        });
    },

    completeWonder(wonderKey, progressIndex) {
        this.builtWonders.push(wonderKey);
        this.wondersInProgress.splice(progressIndex, 1);

        const wonder = WONDERS[wonderKey];
        const wonderLoc = game.wonderLocations.find(w => w.key === wonderKey);
        if (wonderLoc) {
            wonderLoc.isConnected = this.isWonderConnected(wonderKey);
        }

        const el = document.getElementById(`wonder-${wonderKey}`);

        if (el) {
            const progressBar = el.querySelector('.wonder-progress-bar');
            if (progressBar) progressBar.remove();

            el.style.animation = 'wonderComplete 1s ease-out';

            if (!this.isWonderConnected(wonderKey)) {
                el.style.filter = 'brightness(0.5) grayscale(0.8)';
                el.style.opacity = '0.6';
            }
        }

        if (this.isWonderConnected(wonderKey)) {
            addMessage(`${wonder.name} completed and connected! ${wonder.effect}`, 'success');
        } else {
            addMessage(`${wonder.name} completed but NOT CONNECTED! Build a road to activate.`, 'warning');
        }
        AudioManager.playSFX('sfx-success', 0.9);

        if (wonder.bonus.type === 'reveal' && this.isWonderConnected(wonderKey)) {
            game.tribalCities.forEach(tribal => {
                if (!tribal.isConverted) {
                    game.scoutedTribalCities.push(tribal.id);
                    updateTribalUnitIcons(tribal);
                }
            });
            addMessage('All tribal forces revealed!', 'info');
        }
    },

    hasActiveWonder(wonderKey) {
        return this.builtWonders.includes(wonderKey) && this.isWonderConnected(wonderKey);
    },

    isWonderConnected(wonderKey) {
        const wonderLoc = game.wonderLocations.find(w => w.key === wonderKey);
        if (!wonderLoc) return false;

        const nearbyCity = game.cities.find(city => {
            const distance = Math.sqrt(Math.pow(wonderLoc.x - city.x, 2) + Math.pow(wonderLoc.y - city.y, 2));
            return distance < 15 && !city.isRebel;
        });

        if (!nearbyCity) return false;

        const hasRoadToWonder = game.roads.some(road => {
            const city1 = game.cities.find(c => c.id === road.from);
            const city2 = game.cities.find(c => c.id === road.to);

            if (!city1 || !city2) return false;

            const dist1 = Math.sqrt(Math.pow(wonderLoc.x - city1.x, 2) + Math.pow(wonderLoc.y - city1.y, 2));
            const dist2 = Math.sqrt(Math.pow(wonderLoc.x - city2.x, 2) + Math.pow(wonderLoc.y - city2.y, 2));

            return (dist1 < 15 || dist2 < 15) && (city1.id === nearbyCity.id || city2.id === nearbyCity.id);
        });

        return hasRoadToWonder;
    },

    checkWonderConnections() {
        this.builtWonders.forEach(wonderKey => {
            const wonderLoc = game.wonderLocations.find(w => w.key === wonderKey);
            if (!wonderLoc) return;

            const wasConnected = wonderLoc.isConnected;
            const isConnected = this.isWonderConnected(wonderKey);
            wonderLoc.isConnected = isConnected;

            const el = document.getElementById(`wonder-${wonderKey}`);
            if (el) {
                const statusIcon = el.querySelector('.wonder-connection-status');

                if (isConnected) {
                    el.style.filter = 'brightness(1)';
                    el.style.opacity = '1';
                    if (statusIcon) {
                        statusIcon.style.background = '#00ff00';
                        statusIcon.textContent = '✓';
                    }
                } else {
                    el.style.filter = 'brightness(0.5) grayscale(0.8)';
                    el.style.opacity = '0.6';
                    if (statusIcon) {
                        statusIcon.style.background = '#ff4400';
                        statusIcon.textContent = '⚠️';
                    }
                }
            }

            if (!wasConnected && isConnected) {
                const wonder = WONDERS[wonderKey];
                addMessage(`${wonder.name} connected! Bonuses now active!`, 'success');
                AudioManager.playSFX('sfx-success', 0.6);
            } else if (wasConnected && !isConnected) {
                const wonder = WONDERS[wonderKey];
                addMessage(`${wonder.name} disconnected! Bonuses inactive!`, 'warning');
                AudioManager.playSFX('sfx-alert', 0.5);
            }
        });
    },

    getWonderBonus(type) {
        let totalBonus = 0;
        this.builtWonders.forEach(wonderKey => {
            if (!this.isWonderConnected(wonderKey)) return;

            const wonder = WONDERS[wonderKey];
            if (wonder.bonus.type === type) {
                totalBonus += wonder.bonus.value || 0;
            }
        });
        return totalBonus;
    }
};