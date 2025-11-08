const TECHNOLOGIES = {
    basicInfantry: {
        name: 'Militia Training',
        description: 'Infantry +5% ATK',
        cost: 30,
        icon: '⚔️',
        requires: [],
        effect: 'infantryAttack',
        value: 0.05,
        position: { x: 50, y: 50 },
        category: 'military'
    },
    disciplinedInfantry: {
        name: 'Disciplined Ranks',
        description: 'Infantry +10% ATK',
        cost: 60,
        icon: '⚔️',
        requires: ['basicInfantry'],
        effect: 'infantryAttack',
        value: 0.10,
        position: { x: 50, y: 220 },
        category: 'military'
    },
    eliteInfantry: {
        name: 'Elite Warriors',
        description: 'Infantry +15% ATK',
        cost: 120,
        icon: '⚔️',
        requires: ['disciplinedInfantry'],
        effect: 'infantryAttack',
        value: 0.15,
        position: { x: 50, y: 390 },
        category: 'military'
    },
    professionalArmy: {
        name: 'Professional Army',
        description: 'Infantry +25% ATK',
        cost: 200,
        icon: '⚔️',
        requires: ['eliteInfantry'],
        effect: 'infantryAttack',
        value: 0.25,
        position: { x: 50, y: 560 },
        category: 'military'
    },

    mountedScouts: {
        name: 'Mounted Scouts',
        description: 'Cavalry +5% ATK',
        cost: 40,
        icon: '♞',
        requires: [],
        effect: 'cavalryAttack',
        value: 0.05,
        position: { x: 250, y: 50 },
        category: 'military'
    },
    lightCavalry: {
        name: 'Light Cavalry',
        description: 'Cavalry +10% ATK',
        cost: 80,
        icon: '♞',
        requires: ['mountedScouts'],
        effect: 'cavalryAttack',
        value: 0.10,
        position: { x: 250, y: 220 },
        category: 'military'
    },
    heavyCavalry: {
        name: 'Heavy Cavalry',
        description: 'Cavalry +15% ATK',
        cost: 150,
        icon: '♞',
        requires: ['lightCavalry'],
        effect: 'cavalryAttack',
        value: 0.15,
        position: { x: 250, y: 390 },
        category: 'military'
    },
    shockCavalry: {
        name: 'Shock Troops',
        description: 'Cavalry +25% ATK',
        cost: 250,
        icon: '♞',
        requires: ['heavyCavalry'],
        effect: 'cavalryAttack',
        value: 0.25,
        position: { x: 250, y: 560 },
        category: 'military'
    },

    siegeEngines: {
        name: 'Siege Engines',
        description: 'Artillery +5% ATK',
        cost: 50,
        icon: '🎯',
        requires: [],
        effect: 'artilleryAttack',
        value: 0.05,
        position: { x: 450, y: 50 },
        category: 'military'
    },
    mortars: {
        name: 'Mortar Teams',
        description: 'Artillery +12% ATK',
        cost: 100,
        icon: '💣',
        requires: ['siegeEngines'],
        effect: 'artilleryAttack',
        value: 0.12,
        position: { x: 450, y: 220 },
        category: 'military'
    },
    fieldHowitzers: {
        name: 'Field Howitzers',
        description: 'Artillery +20% ATK',
        cost: 180,
        icon: '💥',
        requires: ['mortars'],
        effect: 'artilleryAttack',
        value: 0.20,
        position: { x: 450, y: 390 },
        category: 'military'
    },
    heavyArtillery: {
        name: 'Heavy Artillery',
        description: 'Artillery +35% ATK',
        cost: 300,
        icon: '🚀',
        requires: ['fieldHowitzers'],
        effect: 'artilleryAttack',
        value: 0.35,
        position: { x: 450, y: 560 },
        category: 'military'
    },

    combatTactics: {
        name: 'Combat Tactics',
        description: 'All units +10% DEF',
        cost: 90,
        icon: '🛡️',
        requires: ['basicInfantry', 'mountedScouts'],
        effect: 'defenseBonus',
        value: 0.10,
        position: { x: 650, y: 135 },
        category: 'military'
    },
    advancedTactics: {
        name: 'Advanced Tactics',
        description: 'All units +20% DEF',
        cost: 180,
        icon: '🛡️',
        requires: ['combatTactics', 'disciplinedInfantry', 'lightCavalry'],
        effect: 'defenseBonus',
        value: 0.20,
        position: { x: 650, y: 305 },
        category: 'military'
    },

    massRecruitment: {
        name: 'Mass Conscription',
        description: 'Units need -20% pop',
        cost: 100,
        icon: '👥',
        requires: ['combatTactics'],
        effect: 'recruitmentCost',
        value: 0.20,
        position: { x: 650, y: 475 },
        category: 'military'
    },
    professionalRecruitment: {
        name: 'Professional Recruitment',
        description: 'Units need -40% pop',
        cost: 200,
        icon: '🎖️',
        requires: ['massRecruitment', 'advancedTactics'],
        effect: 'recruitmentCost',
        value: 0.40,
        position: { x: 650, y: 645 },
        category: 'military'
    },

    basicFarming: {
        name: 'Basic Farming',
        description: '+10% food production',
        cost: 25,
        icon: '🌱',
        requires: [],
        effect: 'foodProduction',
        value: 0.10,
        position: { x: 50, y: 800 },
        category: 'agriculture'
    },
    irrigation: {
        name: 'Irrigation',
        description: '+20% food production',
        cost: 50,
        icon: '💧',
        requires: ['basicFarming'],
        effect: 'foodProduction',
        value: 0.20,
        position: { x: 50, y: 970 },
        category: 'agriculture'
    },
    cropRotation: {
        name: 'Crop Rotation',
        description: '+30% food production',
        cost: 100,
        icon: '🌾',
        requires: ['irrigation'],
        effect: 'foodProduction',
        value: 0.30,
        position: { x: 50, y: 1140 },
        category: 'agriculture'
    },
    mechanizedFarming: {
        name: 'Mechanized Farming',
        description: '+50% food production',
        cost: 180,
        icon: '🚜',
        requires: ['cropRotation'],
        effect: 'foodProduction',
        value: 0.50,
        position: { x: 50, y: 1310 },
        category: 'agriculture'
    },

    fertilizers: {
        name: 'Fertilizers',
        description: '+15% pop growth',
        cost: 60,
        icon: '🌿',
        requires: ['basicFarming'],
        effect: 'popGrowth',
        value: 0.15,
        position: { x: 250, y: 885 },
        category: 'agriculture'
    },
    advancedBreeding: {
        name: 'Advanced Breeding',
        description: '+30% pop growth',
        cost: 120,
        icon: '🐄',
        requires: ['fertilizers', 'irrigation'],
        effect: 'popGrowth',
        value: 0.30,
        position: { x: 250, y: 1055 },
        category: 'agriculture'
    },

    basicMining: {
        name: 'Basic Mining',
        description: '+15% metal production',
        cost: 30,
        icon: '⛏️',
        requires: [],
        effect: 'metalProduction',
        value: 0.15,
        position: { x: 450, y: 800 },
        category: 'industry'
    },
    deepMining: {
        name: 'Deep Mining',
        description: '+25% metal production',
        cost: 70,
        icon: '⚒️',
        requires: ['basicMining'],
        effect: 'metalProduction',
        value: 0.25,
        position: { x: 450, y: 970 },
        category: 'industry'
    },
    industrialForges: {
        name: 'Industrial Forges',
        description: '+40% metal production',
        cost: 140,
        icon: '🏭',
        requires: ['deepMining'],
        effect: 'metalProduction',
        value: 0.40,
        position: { x: 450, y: 1140 },
        category: 'industry'
    },

    windmills: {
        name: 'Windmills',
        description: '+15% energy production',
        cost: 40,
        icon: '💨',
        requires: [],
        effect: 'energyProduction',
        value: 0.15,
        position: { x: 650, y: 800 },
        category: 'industry'
    },
    steamPower: {
        name: 'Steam Power',
        description: '+30% energy production',
        cost: 90,
        icon: '⚙️',
        requires: ['windmills'],
        effect: 'energyProduction',
        value: 0.30,
        position: { x: 650, y: 970 },
        category: 'industry'
    },
    advancedGenerators: {
        name: 'Advanced Generators',
        description: '+50% energy production',
        cost: 170,
        icon: '⚡',
        requires: ['steamPower'],
        effect: 'energyProduction',
        value: 0.50,
        position: { x: 650, y: 1140 },
        category: 'industry'
    },

    industrialization: {
        name: 'Industrialization',
        description: '+20% all production',
        cost: 200,
        icon: '🏗️',
        requires: ['deepMining', 'steamPower'],
        effect: 'allProduction',
        value: 0.20,
        position: { x: 250, y: 1225 },
        category: 'industry'
    },

    dirtRoads: {
        name: 'Dirt Roads',
        description: 'Roads cost -25%',
        cost: 35,
        icon: '🛤️',
        requires: [],
        effect: 'roadCost',
        value: 0.25,
        position: { x: 50, y: 1480 },
        category: 'infrastructure'
    },
    pavedRoads: {
        name: 'Paved Roads',
        description: 'Roads cost -50%',
        cost: 80,
        icon: '🛣️',
        requires: ['dirtRoads'],
        effect: 'roadCost',
        value: 0.50,
        position: { x: 50, y: 1650 },
        category: 'infrastructure'
    },
    highways: {
        name: 'Highways',
        description: 'Roads give +10% bonus',
        cost: 150,
        icon: '🚗',
        requires: ['pavedRoads'],
        effect: 'roadBonus',
        value: 0.10,
        position: { x: 50, y: 1820 },
        category: 'infrastructure'
    },

    basicHousing: {
        name: 'Basic Housing',
        description: 'Max pop +50',
        cost: 40,
        icon: '🏠',
        requires: [],
        effect: 'maxPopulation',
        value: 50,
        position: { x: 250, y: 1480 },
        category: 'infrastructure'
    },
    apartments: {
        name: 'Apartments',
        description: 'Max pop +100',
        cost: 90,
        icon: '🏢',
        requires: ['basicHousing'],
        effect: 'maxPopulation',
        value: 100,
        position: { x: 250, y: 1650 },
        category: 'infrastructure'
    },
    skyscrapers: {
        name: 'Skyscrapers',
        description: 'Max pop +200',
        cost: 180,
        icon: '🏙️',
        requires: ['apartments'],
        effect: 'maxPopulation',
        value: 200,
        position: { x: 250, y: 1820 },
        category: 'infrastructure'
    },

    woodenWalls: {
        name: 'Wooden Walls',
        description: 'Upgrades cost -20%',
        cost: 50,
        icon: '🪵',
        requires: [],
        effect: 'upgradeCost',
        value: 0.20,
        position: { x: 450, y: 1480 },
        category: 'infrastructure'
    },
    stoneWalls: {
        name: 'Stone Walls',
        description: 'Upgrades cost -40%',
        cost: 110,
        icon: '🧱',
        requires: ['woodenWalls'],
        effect: 'upgradeCost',
        value: 0.40,
        position: { x: 450, y: 1650 },
        category: 'infrastructure'
    },
    fortresses: {
        name: 'Fortresses',
        description: 'Cities get +15% DEF',
        cost: 200,
        icon: '🏰',
        requires: ['stoneWalls'],
        effect: 'cityDefense',
        value: 0.15,
        position: { x: 450, y: 1820 },
        category: 'infrastructure'
    },

    settlementPlanning: {
        name: 'Settlement Planning',
        description: 'Cities cost -20%',
        cost: 70,
        icon: '🗺️',
        requires: ['basicHousing', 'dirtRoads'],
        effect: 'cityCost',
        value: 0.20,
        position: { x: 650, y: 1565 },
        category: 'infrastructure'
    },
    urbanPlanning: {
        name: 'Urban Planning',
        description: 'Cities cost -40%',
        cost: 150,
        icon: '📐',
        requires: ['settlementPlanning', 'apartments', 'pavedRoads'],
        effect: 'cityCost',
        value: 0.40,
        position: { x: 650, y: 1735 },
        category: 'infrastructure'
    }
};

const TechTree = {
    unlockedTechs: [],
    isOpen: false,

    init() {
        this.createTechButton();
        this.createTechOverlay();
    },

    createTechButton() {
        const btn = document.createElement('button');
        btn.id = 'tech-tree-btn';
        btn.textContent = 'Research';
        btn.onclick = () => this.toggleTechTree();

        const controls = document.getElementById('controls');
        const pauseBtn = document.getElementById('pause-btn');
        controls.insertBefore(btn, pauseBtn);
    },

    createTechOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tech-tree-overlay';
        overlay.innerHTML = `
            <div id="tech-tree-panel">
                <div id="tech-tree-header">
                    <h2>RESEARCH TREE</h2>
                    <div id="research-points-display">Research Points: <span id="rp-value">0</span></div>
                    <button id="close-tech-tree">✕</button>
                </div>
                <div id="tech-nodes-container">
                    <canvas id="tech-canvas"></canvas>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('close-tech-tree').onclick = () => this.toggleTechTree();

        this.updateTechDisplay();
    },

    toggleTechTree() {
        this.isOpen = !this.isOpen;
        const overlay = document.getElementById('tech-tree-overlay');
        overlay.style.display = this.isOpen ? 'flex' : 'none';

        if (this.isOpen) {
            game.paused = true;
            this.updateTechDisplay();
            this.drawConnections();
        } else {
            game.paused = false;
        }
    },

    updateTechDisplay() {
        const container = document.getElementById('tech-nodes-container');
        if (!container) return;

        const existingCanvas = container.querySelector('#tech-canvas');
        const canvasParent = existingCanvas ? existingCanvas.parentElement : null;

        container.innerHTML = '';
        document.getElementById('rp-value').textContent = Math.floor(game.researchPoints);

        if (existingCanvas && canvasParent === container) {
            container.appendChild(existingCanvas);
        }

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.zIndex = '2';

        const maxY = Math.max(...Object.values(TECHNOLOGIES).map(t => t.position.y)) + 200;
        wrapper.style.height = maxY + 'px';
        wrapper.style.minHeight = maxY + 'px';

        Object.keys(TECHNOLOGIES).forEach(techKey => {
            const tech = TECHNOLOGIES[techKey];
            const isUnlocked = this.unlockedTechs.includes(techKey);
            const canResearch = !isUnlocked && this.canResearch(techKey);
            const requirementsMet = this.requirementsMet(techKey);

            const node = document.createElement('div');
            node.className = `tech-node ${isUnlocked ? 'unlocked' : ''} ${!requirementsMet ? 'locked' : ''}`;
            node.style.left = tech.position.x + 'px';
            node.style.top = tech.position.y + 'px';
            node.setAttribute('data-tech', techKey);

            if (canResearch && requirementsMet) {
                node.onclick = () => {
                    this.researchTech(techKey);
                    this.drawConnections();
                };
            }

            node.innerHTML = `
                <div class="tech-node-icon">${tech.icon}</div>
                <div class="tech-node-name">${tech.name}</div>
                <div class="tech-node-desc">${tech.description}</div>
                <div class="tech-node-cost">${tech.cost} RP</div>
                ${isUnlocked ? '<div class="tech-node-check">✓</div>' : ''}
            `;

            wrapper.appendChild(node);
        });

        container.appendChild(wrapper);
    },

    drawConnections() {
        const canvas = document.getElementById('tech-canvas');
        const container = document.getElementById('tech-nodes-container');
        const ctx = canvas.getContext('2d');

        const maxY = Math.max(...Object.values(TECHNOLOGIES).map(t => t.position.y)) + 200;
        canvas.width = 860;
        canvas.height = maxY;

        canvas.style.width = '860px';
        canvas.style.height = maxY + 'px';

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        Object.keys(TECHNOLOGIES).forEach(techKey => {
            const tech = TECHNOLOGIES[techKey];

            if (tech.requires.length === 0) return;

            const toX = tech.position.x + 60 + 20;
            const toY = tech.position.y + 20;

            if (tech.requires.length === 1) {
                const reqKey = tech.requires[0];
                const fromTech = TECHNOLOGIES[reqKey];
                const isFromUnlocked = this.unlockedTechs.includes(reqKey);
                const isToUnlocked = this.unlockedTechs.includes(techKey);
                const bothUnlocked = isFromUnlocked && isToUnlocked;

                const fromX = fromTech.position.x + 60 + 20;
                const fromY = fromTech.position.y + 120;

                const midY = (fromY + toY) / 2;

                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.bezierCurveTo(fromX, midY, toX, midY, toX, toY);
                ctx.lineWidth = 4;
                ctx.strokeStyle = bothUnlocked ? '#00ff00' : 'rgba(100, 150, 255, 0.4)';

                if (bothUnlocked) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00ff00';
                } else {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = 'rgba(100, 150, 255, 0.3)';
                }

                ctx.stroke();

                if (bothUnlocked) {
                    ctx.beginPath();
                    ctx.arc(toX, toY, 6, 0, Math.PI * 2);
                    ctx.fillStyle = '#00ff00';
                    ctx.shadowBlur = 20;
                    ctx.fill();
                }
            } else {
                const avgX = tech.requires.reduce((sum, reqKey) => {
                    return sum + TECHNOLOGIES[reqKey].position.x;
                }, 0) / tech.requires.length;

                const avgY = tech.requires.reduce((sum, reqKey) => {
                    return sum + TECHNOLOGIES[reqKey].position.y;
                }, 0) / tech.requires.length;

                const convergenceX = avgX + 60 + 20;
                const convergenceY = avgY + 140;

                tech.requires.forEach(reqKey => {
                    const fromTech = TECHNOLOGIES[reqKey];
                    const allReqsUnlocked = tech.requires.every(r => this.unlockedTechs.includes(r));
                    const isToUnlocked = this.unlockedTechs.includes(techKey);
                    const allUnlocked = allReqsUnlocked && isToUnlocked;

                    const fromX = fromTech.position.x + 60 + 20;
                    const fromY = fromTech.position.y + 120;

                    const midY = (fromY + convergenceY) / 2;

                    ctx.beginPath();
                    ctx.moveTo(fromX, fromY);
                    ctx.bezierCurveTo(fromX, midY, convergenceX, midY, convergenceX, convergenceY);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = allUnlocked ? '#00ff00' : 'rgba(100, 150, 255, 0.4)';

                    if (allUnlocked) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#00ff00';
                    } else {
                        ctx.shadowBlur = 5;
                        ctx.shadowColor = 'rgba(100, 150, 255, 0.3)';
                    }

                    ctx.stroke();
                });

                const allReqsUnlocked = tech.requires.every(r => this.unlockedTechs.includes(r));
                const isToUnlocked = this.unlockedTechs.includes(techKey);
                const allUnlocked = allReqsUnlocked && isToUnlocked;

                const midY = (convergenceY + toY) / 2;

                ctx.beginPath();
                ctx.moveTo(convergenceX, convergenceY);
                ctx.bezierCurveTo(convergenceX, midY, toX, midY, toX, toY);
                ctx.lineWidth = 5;
                ctx.strokeStyle = allUnlocked ? '#00ff00' : 'rgba(100, 150, 255, 0.4)';

                if (allUnlocked) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#00ff00';
                } else {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = 'rgba(100, 150, 255, 0.3)';
                }

                ctx.stroke();

                ctx.beginPath();
                ctx.arc(convergenceX, convergenceY, 8, 0, Math.PI * 2);
                ctx.fillStyle = allUnlocked ? '#00ff00' : 'rgba(100, 150, 255, 0.6)';
                ctx.shadowBlur = allUnlocked ? 25 : 10;
                ctx.fill();

                if (allUnlocked) {
                    ctx.beginPath();
                    ctx.arc(toX, toY, 6, 0, Math.PI * 2);
                    ctx.fillStyle = '#00ff00';
                    ctx.shadowBlur = 20;
                    ctx.fill();
                }
            }
        });
    },

    requirementsMet(techKey) {
        const tech = TECHNOLOGIES[techKey];
        return tech.requires.every(reqKey => this.unlockedTechs.includes(reqKey));
    },

    canResearch(techKey) {
        const tech = TECHNOLOGIES[techKey];
        return game.researchPoints >= tech.cost && this.requirementsMet(techKey);
    },

    researchTech(techKey) {
        if (this.unlockedTechs.includes(techKey)) return;
        if (!this.canResearch(techKey)) {
            addMessage('Cannot research this technology yet!', 'warning');
            return;
        }

        const tech = TECHNOLOGIES[techKey];
        game.researchPoints -= tech.cost;
        this.unlockedTechs.push(techKey);

        if (tech.effect === 'maxPopulation') {
            game.cities.forEach(city => {
                city.maxPopulation = 500 + this.getTechBonus('maxPopulation');
                updateCityDisplay(city);
            });
        }

        addMessage(`Researched: ${tech.name}!`, 'success');
        AudioManager.playSFX('sfx-success', 0.7);

        this.updateTechDisplay();
        this.drawConnections();
    },

    getTechBonus(effectType) {
        let totalBonus = 0;
        this.unlockedTechs.forEach(techKey => {
            const tech = TECHNOLOGIES[techKey];
            if (tech.effect === effectType) {
                totalBonus += tech.value;
            }
        });
        return totalBonus;
    }
};