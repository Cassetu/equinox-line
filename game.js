const CITY_RADIUS = 8;
const MIN_CITY_DISTANCE = 5;
const TRIBAL_ROAD_INTERVAL = 1000;
const TRIBAL_CITY_INTERVAL_MIN = 3000;
const TRIBAL_CITY_INTERVAL_MAX = 4000;
const TRIBAL_MAX_EXPANSION = 35;
const CITY_FEATURE_RADIUS = 12;

const UNIT_TYPES = {
    infantry: {
        name: 'Infantry',
        attack: 5,
        defense: 3,
        cost: { food: 50, metal: 50, energy: 0 }
    },
    cavalry: {
        name: 'Cavalry',
        attack: 12,
        defense: 5,
        cost: { food: 100, metal: 100, energy: 50 }
    },
    artillery: {
        name: 'Artillery',
        attack: 20,
        defense: 2,
        cost: { food: 50, metal: 300, energy: 150 }
    }
};

const CITY_SPECIALIZATIONS = {
none: {
    name: 'No Specialization',
    resourceBonus: 0,
    growthBonus: 0,
    recruitCostMod: 1,
    cost: 0,
    icon: '🏘️',
    description: 'Standard city'
},
military: {
    name: 'Military Fortress',
    resourceBonus: -0.2,
    growthBonus: -0.1,
    recruitCostMod: 0.75,
    cost: { food: 200, metal: 250, energy: 50 },
    icon: '⚔️',
    description: '25% cheaper units, -20% resources, -10% growth'
},
trade: {
name: 'Trade Hub',
resourceBonus: 0.5,
growthBonus: 0,
recruitCostMod: 1.2,
cost: { food: 150, metal: 200, energy: 50 },
    icon: '💰',
    description: '+50% resources, 20% more expensive units'
},
research: {
    name: 'Research Center',
    resourceBonus: 0.2,
    growthBonus: 0.3,
    recruitCostMod: 1,
    cost: { food: 200, metal: 150, energy: 250 },
    icon: '🔬',
    description: '+20% resources, +30% growth, generates research',
    researchRate: 0.1
}
};

const LAWS = {
        none: { name: 'No Special Laws', resourceBonus: 0, happinessPenalty: 0 },
        productive: { name: 'Increased Production', resourceBonus: 0.5, happinessPenalty: -1 },
        efficient: { name: 'Efficiency Standards', resourceBonus: 0.3, happinessPenalty: -0.5 },
        harsh: { name: 'Harsh Labor Laws', resourceBonus: 1.0, happinessPenalty: -2 },
        relaxed: { name: 'Relaxed Work Schedule', resourceBonus: -0.2, happinessPenalty: 1 }
    };

const PERKS = {
veteranTroops: { name: 'Veteran Troops', description: 'Start with +2 combo', level: 1, effect: 'combo' },
swiftStrike: { name: 'Swift Strike', description: 'First 5 arrows 30% slower', level: 2, effect: 'slow' },
defensiveGenius: { name: 'Defensive Genius', description: 'Take 25% less damage', level: 3, effect: 'defense' },
relentless: { name: 'Relentless', description: 'First miss doesn\'t break combo', level: 4, effect: 'forgive' },
inspiration: { name: 'Inspiration', description: 'High morale boosts damage', level: 5, effect: 'morale' }
};

const FORMATIONS = {
offensive: { atkMod: 1.2, defMod: 0.9 },
balanced: { atkMod: 1.0, defMod: 1.0 },
defensive: { atkMod: 0.9, defMod: 1.2 }
};

const WEATHER_EVENTS = [
{ name: '☀️ Clear Skies', effect: 'easy', description: 'Perfect visibility' },
{ name: '🌫️ Fog of War', effect: 'late', description: 'Arrows appear late' },
{ name: '🌪️ Sandstorm', effect: 'vanish', description: 'Arrows vanish briefly' },
{ name: '❄️ Frost', effect: 'slow', description: 'Everything slows down' }
];

const RESOURCE_TYPES = {
food: { name: 'Food', icon: '🌾', color: '#90EE90' },
metal: { name: 'Metal', icon: '⚙️', color: '#C0C0C0' },
energy: { name: 'Energy', icon: '⚡', color: '#FFD700' }
};

const PEACE_DEMANDS = [
{
    id: 'territory',
    text: 'We demand you surrender one of your cities to us.',
    consequence: 'You will lose your weakest city',
    check: () => game.cities.length > 1,
    apply: () => {
        const weakest = game.cities.reduce((min, city) =>
            city.population < min.population ? city : min
        );
        const el = document.getElementById(`city-${weakest.id}`);
        if (el) el.remove();
        game.cities = game.cities.filter(c => c.id !== weakest.id);
        addMessage(`Surrendered ${weakest.name} to tribes`, 'warning');
    }
},
{
id: 'military',
text: 'Your military threatens us. Disband 30% of your forces.',
consequence: 'You will lose 30% of all units',
check: () => {
    const totalUnits = game.cities.reduce((sum, c) =>
        sum + c.stationedUnits.infantry + c.stationedUnits.cavalry + c.stationedUnits.artillery, 0);
    return totalUnits > 3;
},
apply: () => {
    game.cities.forEach(city => {
        const infLost = Math.ceil(city.stationedUnits.infantry * 0.3);
        const cavLost = Math.ceil(city.stationedUnits.cavalry * 0.3);
        const artLost = Math.ceil(city.stationedUnits.artillery * 0.3);
        city.stationedUnits.infantry -= infLost;
        city.stationedUnits.cavalry -= cavLost;
        city.stationedUnits.artillery -= artLost;
    });
    addMessage('Disbanded 30% of all military forces', 'warning');
}
},
{
    id: 'tribute',
    text: 'Pay us 500 resources as compensation for this war.',
    consequence: 'You will lose 500 resources',
    check: () => hasResources(500),
    apply: () => {
        spendResources(500);
        addMessage('Paid 500 resource tribute', 'warning');
    }
},
{
    id: 'humiliation',
    text: 'Accept our cultural superiority. Your people will be demoralized.',
    consequence: 'All cities permanently lose 5 max happiness',
    check: () => true,
    apply: () => {
        game.cities.forEach(city => {
            city.happiness = Math.max(0, city.happiness - 5);
            updateCityDisplay(city);
        });
        addMessage('Your people are demoralized by the peace terms', 'warning');
    }
}
];

const game = {
    running: false, paused: false, year: 0, resources: { food: 500, metal: 400, energy: 250 },
    researchPoints: 0,
    cities: [], roads: [], features: [], tribalCities: [], tribalRoads: [],
    habitableZone: { left: 35, width: 30 }, zoneShiftSpeed: -0.5,
    selectedCity: null, selectedType: null, placingCity: false, buildingRoad: false, roadStartCity: null,
    messages: [], gatherCooldown: 0, spaceportProgress: 0, spaceportBuilding: false,
    tribalReputation: 50, tribalRelation: 'neutral', hasEmbassy: false,
    tribalTradeCooldown: 0, activeLaw: 'none',
    tribalRoadTimer: 0, tribalCityTimer: 0,
    ddrActive: false, ddrCombo: 0, ddrSequence: [], ddrCurrentIndex: 0, ddrBonus: 0,
    ddrTimeout: null, currentBattle: null, tribalsDefeated: false,
    tribalMilitaryWarned: false, commanderXP: 0, commanderLevel: 1, unlockedPerks: [],
    activePerks: [], scoutedTribalCities: [], battleFormation: 'balanced',
    retreatThreshold: 50, battlePhase: 0, battleMorale: 100,
    weatherEvent: null,
    peaceTalksActive: false,
    peaceTalksTimer: 0,
    peaceDemandsMet: 0,
    peaceDemands: [],
    currentPeaceDemand: null,
    peaceTreatyCooldown: 0,
    lastShownDemandIndex: -1,
    attackingCities: [],
    selectingAttackers: false,
    targetTribal: null
};


let cityIdCounter = 0, roadIdCounter = 0, tribalIdCounter = 0, gameLoop;
let usedNames = [];
let mapZoom = 1.0;
let mapPanX = 0;
let mapPanY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;


const CITY_NAMES = [
'Aurora', 'Nexus', 'Haven', 'Meridian', 'Eclipse', 'Solaris', 'Twilight', 'Umbra', 'Zenith', 'Nova', 'Celestia', 'Radiance',
'Equinox', 'Halcyon', 'Solara Prime', 'Obsidian Reach', 'Aether Spire', 'Terminus', 'Lunaris', 'Polarion',
'Cradle', 'Dawnspire', 'Noctis', 'Lumenport', 'Arclight', 'Ashen Verge', 'Mirage Basin', 'Helion Rise',
'Penumbra Station', 'Seraphis', 'Starhold', 'Driftveil', 'Cinder Gate', 'Corona Haven', 'Tenebris', 'Skyglass', 'Ecliptane'
];
    const TRIBAL_NAMES = [
'Flame Walkers', 'Sun Touched', 'Ember Clan', 'Ash Dwellers', 'Heat Seekers', 'Scorch Tribe', 'Fire Born',
'Dusk Hunters', 'Shadow Bloom', 'Glow Eaters', 'Cinder Kin', 'Lava Striders', 'Star Burned', 'Torch Bearers',
'Sun Bleached', 'The Molten', 'Kindled Ones', 'Light Breakers', 'Ashen Sons', 'Gleam Skinners',
'Obsidian Hearts', 'Crackled Voices', 'Solar Drifters', 'Blaze Weavers', 'Glowfangs', 'The Scalded',
'Sunward Nomads', 'Twilight Howlers', 'Soot Treaders', 'Iron Dust', 'Heat Wraiths', 'Skyfire Kin'
];

    function addMessage(text, type = 'info') {
        const msg = document.createElement('div');
        msg.className = `message message-${type}`;
        msg.textContent = text;
        const container = document.getElementById('messages');
        container.insertBefore(msg, container.firstChild);
        if (container.children.length > 8) {
            container.removeChild(container.lastChild);
        }
    }

    function gameOver(reason) {
        game.running = false;
        clearInterval(gameLoop);
        const panel = document.getElementById('game-over');
        document.getElementById('game-over-msg').textContent = reason;
        panel.style.display = 'block';
    }

function toggleCollapsible(sectionId) {
const content = document.getElementById(`${sectionId}-content`);
const indicator = document.getElementById(`${sectionId}-indicator`);

content.classList.toggle('open');
indicator.classList.toggle('open');

AudioManager.playSFX('sfx-button-click', 0.3);
}


    function victory() {
        game.running = false;
        clearInterval(gameLoop);
   AudioManager.playVictoryMusic();
        const panel = document.getElementById('game-over');
        panel.className = 'victory';
        const totalPop = game.cities.reduce((sum, c) => sum + Math.floor(c.population), 0);
        document.getElementById('game-over-msg').innerHTML = `<p style="font-size: 18px; margin: 20px 0;">Civilization evacuated to a stable planet!</p><p><strong>Statistics:</strong></p><p> Cities: ${game.cities.length}</p><p>Population: ${totalPop}</p><p>Years: ${Math.floor(game.year)}</p><p>Resources: ${Math.floor(game.resources)}</p><p style="margin-top: 20px; color: #00ff00;"> VICTORY!</p>`;
        panel.querySelector('h2').textContent = 'Civilization Saved!';
        panel.style.display = 'block';
    }

    function isCityInHabitableZone(city) {
        const zoneEnd = game.habitableZone.left + game.habitableZone.width;
        return city.position >= game.habitableZone.left && city.position <= zoneEnd;
    }

    function getDistanceFromZone(city) {
        const zoneEnd = game.habitableZone.left + game.habitableZone.width;
        if (city.position < game.habitableZone.left) {
            return game.habitableZone.left - city.position;
        } else if (city.position > zoneEnd) {
            return city.position - zoneEnd;
        }
        return 0;
    }

function canCallReinforcements() {
    if (!hasResources(300)) return false;
        const closestCity = getClosestPlayerCity(game.currentBattle);
    if (!closestCity) return false;
        const connectedCities = getConnectedCityCount(closestCity);
        return connectedCities > 0;
}

function calculateBattlePrediction(tribal) {
const attackingCities = game.attackingCities.length > 0 ?
                        game.attackingCities :
                        [getClosestPlayerCity(tribal)];

if (!attackingCities[0]) return null;

const formation = FORMATIONS[game.battleFormation];

let totalPlayerAttack = 0;
let totalPlayerDefense = 0;
let avgDistancePenalty = 0;
let closestDistance = Infinity;
let furthestDistance = 0;

attackingCities.forEach(city => {
    const distance = Math.sqrt(Math.pow(tribal.x - city.x, 2) +
                               Math.pow(tribal.y - city.y, 2));

    closestDistance = Math.min(closestDistance, distance);
    furthestDistance = Math.max(furthestDistance, distance);

    let distancePenalty = 1.0;
    if (distance > 20) {
        distancePenalty = Math.max(0.5, 1 - ((distance - 20) * 0.02));
    }

    const cityAttack = (city.stationedUnits.infantry * 5 +
                       city.stationedUnits.cavalry * 12 +
                       city.stationedUnits.artillery * 20) * distancePenalty;

    const cityDefense = city.stationedUnits.infantry * 3 +
                       city.stationedUnits.cavalry * 5 +
                       city.stationedUnits.artillery * 2;

    totalPlayerAttack += cityAttack;
    totalPlayerDefense += cityDefense;
    avgDistancePenalty += distancePenalty;
});

avgDistancePenalty /= attackingCities.length;

totalPlayerAttack *= formation.atkMod;
totalPlayerDefense *= formation.defMod;

const tribalAttack = tribal.units.infantry * 5 +
                    tribal.units.cavalry * 12 +
                    tribal.units.artillery * 20;
const tribalDefense = tribal.units.infantry * 3 +
                     tribal.units.cavalry * 5 +
                     tribal.units.artillery * 2;

const avgCityHappiness = game.cities.length > 0
    ? game.cities.reduce((sum, c) => sum + c.happiness, 0) / game.cities.length
    : 50;
const moraleMod = 0.5 + (avgCityHappiness / 100);

const effectivePlayerAttack = totalPlayerAttack * moraleMod;
const powerRatio = effectivePlayerAttack / (tribalDefense + tribalAttack * 0.3);

let risk = 'fair';
if (powerRatio > 2.0) risk = 'easy';
else if (powerRatio > 1.2) risk = 'fair';
else if (powerRatio > 0.7) risk = 'hard';
else risk = 'suicide';

let prediction = 'Uncertain';
if (powerRatio > 1.5) prediction = 'Victory Likely';
else if (powerRatio > 1.0) prediction = 'Victory Possible';
else if (powerRatio > 0.8) prediction = 'Uncertain';
else prediction = 'Defeat Likely';

return {
    risk,
    powerRatio,
    distance: closestDistance,
    avgDistance: (closestDistance + furthestDistance) / 2,
    distancePenalty: avgDistancePenalty,
    moraleMod,
    playerForces: Math.floor(effectivePlayerAttack),
    tribalForces: Math.floor(tribalAttack + tribalDefense),
    prediction,
    attackingCities: attackingCities.length,
    totalPlayerAttack: Math.floor(totalPlayerAttack),
    totalPlayerDefense: Math.floor(totalPlayerDefense)
};
}

function isTribalScouted(tribalId) {
return game.scoutedTribalCities.includes(tribalId);
}

function getConnectedCityCount(city) {
return getConnectedCities(city.id).length;
}



function getUnitIconPosition(index, total, citySize = 40) {
const startY = -10;
const spacing = 12;
const iconsPerRow = 4;

const row = Math.floor(index / iconsPerRow);
const col = index % iconsPerRow;
const iconsInThisRow = Math.min(iconsPerRow, total - (row * iconsPerRow));

const rowWidth = (iconsInThisRow - 1) * spacing;
const startX = -rowWidth / 2;

const x = startX + (col * spacing);
const y = startY + (row * spacing);

return { x, y };
}

function updateFeatureSharingIndicators() {
game.features.forEach(feature => {
    const citiesNearby = game.cities.filter(city => {
        const dist = Math.sqrt(Math.pow(city.x - feature.x, 2) + Math.pow(city.y - feature.y, 2));
        return dist < 12 && !city.isRebel;
    }).length;

    const featureElements = document.querySelectorAll(`.${feature.type}-feature`);
    featureElements.forEach(el => {
        const existingIndicator = el.querySelector('.feature-share-indicator');
        if (existingIndicator) existingIndicator.remove();

        if (citiesNearby > 1) {
            const indicator = document.createElement('div');
            indicator.className = 'feature-share-indicator';
            indicator.textContent = citiesNearby;
            indicator.title = `Shared by ${citiesNearby} cities`;
            el.appendChild(indicator);
        }
    });
});
}

function updateCityUnitIcons(city) {
const cityEl = document.getElementById(`city-${city.id}`);
if (!cityEl) return;

cityEl.querySelectorAll('.unit-icon').forEach(icon => icon.remove());

const units = [];

for (let i = 0; i < city.stationedUnits.infantry; i++) {
    units.push({ type: 'infantry', symbol: '⚔' });
}
for (let i = 0; i < city.stationedUnits.cavalry; i++) {
    units.push({ type: 'cavalry', symbol: '♞' });
}
for (let i = 0; i < city.stationedUnits.artillery; i++) {
    units.push({ type: 'artillery', symbol: '⚡' });
}

units.forEach((unit, index) => {
    const pos = getUnitIconPosition(index, units.length);
    const iconEl = document.createElement('div');
    iconEl.className = `unit-icon unit-icon-${unit.type}`;
    iconEl.style.left = `${pos.x}px`;
    iconEl.style.top = `${pos.y}px`;
    iconEl.title = unit.type.charAt(0).toUpperCase() + unit.type.slice(1);

    iconEl.innerHTML = `
        <div class="unit-icon-inner">
            <div class="unit-icon-outer-ring"></div>
            <div class="unit-icon-middle-layer"></div>
            <div class="unit-icon-core">
                <span class="unit-icon-symbol">${unit.symbol}</span>
            </div>
        </div>
    `;

    cityEl.appendChild(iconEl);
});
}

function updateTribalUnitIcons(tribal) {
const tribalEl = document.getElementById(`tribal-${tribal.id}`);
if (!tribalEl || tribal.isConverted) return;

const isWartime = game.tribalRelation === 'war';
const isScouted = isTribalScouted(tribal.id);

tribalEl.querySelectorAll('.unit-icon').forEach(icon => icon.remove());

if (isWartime && !isScouted) {
    const pos = getUnitIconPosition(0, 1, 35);
    const iconEl = document.createElement('div');
    iconEl.className = 'unit-icon';
    iconEl.style.left = `${pos.x}px`;
    iconEl.style.top = `${pos.y}px`;
    iconEl.title = 'Unknown forces - Scout to reveal';
    iconEl.style.fontSize = '18px';
    iconEl.style.color = '#ff4400';
    iconEl.style.textShadow = '0 0 5px rgba(255, 68, 0, 0.8)';
    iconEl.innerHTML = '?';

    tribalEl.appendChild(iconEl);
    return;
}

const units = [];

for (let i = 0; i < tribal.units.infantry; i++) {
    units.push({ type: 'infantry', symbol: '⚔' });
}
for (let i = 0; i < tribal.units.cavalry; i++) {
    units.push({ type: 'cavalry', symbol: '♞' });
}
for (let i = 0; i < tribal.units.artillery; i++) {
    units.push({ type: 'artillery', symbol: '⚡' });
}

units.forEach((unit, index) => {
    const pos = getUnitIconPosition(index, units.length, 35);
    const iconEl = document.createElement('div');
    iconEl.className = `unit-icon unit-icon-${unit.type}`;
    iconEl.style.left = `${pos.x}px`;
    iconEl.style.top = `${pos.y}px`;
    iconEl.title = `Tribal ${unit.type}`;

    iconEl.innerHTML = `
        <div class="unit-icon-inner">
            <div class="unit-icon-outer-ring"></div>
            <div class="unit-icon-middle-layer"></div>
            <div class="unit-icon-core">
                <span class="unit-icon-symbol">${unit.symbol}</span>
            </div>
        </div>
    `;

    tribalEl.appendChild(iconEl);
});
}




function callReinforcements() {
    if (!canCallReinforcements()) {
        addMessage('No reinforcements available!', 'warning');
        return;
    }

    const closestCity = getClosestPlayerCity(game.currentBattle);

    spendResources(300);
    closestCity.stationedUnits.infantry += 1;
    closestCity.stationedUnits.cavalry += 1;

    addMessage('Reinforcements arriving!', 'success');
    AudioManager.playSFX('sfx-success', 0.6);

    game.ddrSequence.push('ArrowUp', 'ArrowRight');
}



    function updateHabitableZone() {
        const zone = document.getElementById('habitable-zone');
        zone.style.left = `${game.habitableZone.left}%`;
        zone.style.width = `${game.habitableZone.width}%`;
    }

    function getZoneType(position) {
        if (position < 30) return 'hot';
        if (position > 65) return 'cold';
        return 'habitable';
    }

    function getCityName() {
        const available = CITY_NAMES.filter(n => !usedNames.includes(n));
        if (available.length === 0) return `Settlement ${cityIdCounter}`;
        const name = available[Math.floor(Math.random() * available.length)];
        usedNames.push(name);
        return name;
    }

    function getConnectedCities(cityId) {
        const connected = new Set();
        game.roads.forEach(road => {
            if (road.from === cityId) connected.add(road.to);
            if (road.to === cityId) connected.add(road.from);
        });
        return Array.from(connected).map(id => game.cities.find(c => c.id === id)).filter(Boolean);
    }

    function getRoadBonus(city) {
        const connections = getConnectedCities(city.id).length;
        if (connections === 0) return 0;
        if (connections === 1) return 0.2;
        if (connections === 2) return 0.35;
        return 0.5;
    }

function getCityFeatureBonus(city) {
    let foodBonus = 0;
    let metalBonus = 0;
    let energyBonus = 0;
    let growthPenalty = 0;
    const nearbyFeatures = [];

    game.features.forEach(feature => {
        const dist = Math.sqrt(Math.pow(city.x - feature.x, 2) + Math.pow(city.y - feature.y, 2));
        if (dist < CITY_FEATURE_RADIUS) {
            const citiesNearFeature = game.cities.filter(c => {
                const d = Math.sqrt(Math.pow(c.x - feature.x, 2) + Math.pow(c.y - feature.y, 2));
                return d < 12 && !c.isRebel;
            });

            const shareCount = Math.max(1, citiesNearFeature.length);
            const sharedFoodBonus = (feature.foodBonus || 0) / shareCount;
            const sharedMetalBonus = (feature.metalBonus || 0) / shareCount;
            const sharedEnergyBonus = (feature.energyBonus || 0) / shareCount;
            const sharedGrowthPenalty = (feature.growthPenalty || 0) / shareCount;

            foodBonus += sharedFoodBonus;
            metalBonus += sharedMetalBonus;
            energyBonus += sharedEnergyBonus;
            growthPenalty += sharedGrowthPenalty;

            nearbyFeatures.push({
                ...feature,
                sharedWith: shareCount,
                actualFoodBonus: sharedFoodBonus,
                actualMetalBonus: sharedMetalBonus,
                actualEnergyBonus: sharedEnergyBonus,
                actualGrowthPenalty: sharedGrowthPenalty
            });
        }
    });

    return {
        foodBonus: foodBonus || 0,
        metalBonus: metalBonus || 0,
        energyBonus: energyBonus || 0,
        growthPenalty: growthPenalty || 0,
        nearbyFeatures
    };
}

function updateRoadPosition(roadEl, city1Id, city2Id) {
    const city1 = game.cities.find(c => c.id === city1Id);
    const city2 = game.cities.find(c => c.id === city2Id);
    if (!city1 || !city2) return;

    const planetView = document.getElementById('planet-view');
    const rect = planetView.getBoundingClientRect();
    const aspectRatio = rect.height / rect.width;

    const citySize = 20;

    const x1 = city1.x;
    const y1 = city1.y;
    const x2 = city2.x;
    const y2 = city2.y * aspectRatio;

    const dx = x2 - x1;
    const dy = y2 - (y1 * aspectRatio);
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    roadEl.style.left = `${x1}%`;
    roadEl.style.top = `${y1}%`;
    roadEl.style.width = `${length}%`;
    roadEl.style.transform = `translate(${citySize}px, ${citySize}px) rotate(${angle}deg)`;
    roadEl.style.transformOrigin = '0 0';
}

function initiatePeaceTalks() {
    if (!hasResources(1000)) {
        addMessage('Need 1000 resources to begin peace talks!', 'warning');
        return;
    }

    spendResources(1000);
    game.peaceTalksActive = true;
    game.peaceTalksTimer = 0;
    game.peaceDemandsMet = 0;
    game.peaceDemands = [];
    game.lastShownDemandIndex = -1;

    const availableDemands = PEACE_DEMANDS.filter(d => d.check());

    if (availableDemands.length === 0) {
    addMessage('No valid peace demands available! Treaty automatically accepted.', 'success');
    game.tribalRelation = 'neutral';
    game.tribalReputation = 50;
    game.peaceTreatyCooldown = 700;
    return;
    }

    for (let i = 0; i < 3 && availableDemands.length > 0; i++) {
        const index = Math.floor(Math.random() * availableDemands.length);
        game.peaceDemands.push(availableDemands[index]);
        availableDemands.splice(index, 1);
    }

    addMessage('Peace negotiations begun! Tribes will present demands over 3 years.', 'info');
    AudioManager.playSFX('sfx-success', 0.5);
}

function updateCityDisplay(city) {
    const el = document.getElementById(`city-${city.id}`);
    if (!el) return;
    updateCityUnitIcons(city);
    const inZone = isCityInHabitableZone(city);
    const popPercent = (city.population / city.maxPopulation) * 100;
    el.querySelector('.population-fill').style.width = `${popPercent}%`;

    let className = `city city-${city.zoneType}`;
    if (city.isRebel) {
        className += ' city-rebel';
    } else if (inZone) {
        className += ' city-healthy';
    } else {
        const dist = getDistanceFromZone(city);
        className += dist < 10 ? ' city-warning' : ' city-danger';
    }
    el.className = className;

    game.roads.forEach(road => {
        if (road.from === city.id || road.to === city.id) {
            const roadEl = document.getElementById(`road-${road.id}`);
            if (roadEl) {
                updateRoadPosition(roadEl, road.from, road.to);
            }
        }
    });
}

function selectCity(city) {
    game.selectedCity = city;
    game.selectedType = 'city';
    const foodColor = city.foodStockpile > 50 ? '#4CAF50' : (city.foodStockpile > 20 ? '#ffaa00' : '#ff4400');
    const foodText = `
         <div style="background: rgba(139,69,19,0.2); padding: 8px; border-radius: 5px; margin: 8px 0;">
             <h4 style="color: #DEB887; font-size: 12px; margin-bottom: 6px;">Food Supply</h4>
             <div style="width: 100%; height: 12px; background: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; margin: 5px 0;">
                 <div class="food-stockpile-fill" style="width: ${city.foodStockpile}%; height: 100%; background: ${foodColor}; transition: width 0.3s;"></div>
             </div>
             <p class="food-stockpile-text" style="font-size: 9px;">Stockpile: ${Math.floor(city.foodStockpile)}/100</p>
             <p class="food-consumption-text" style="font-size: 9px;">Consumption: ${city.foodConsumptionRate.toFixed(2)}/tick</p>
             <p class="food-autofeed-text" style="font-size: 9px;">Auto-feed: ${city.autoFeed ? '✓ ON' : '✗ OFF'}</p>
             ${!isCityInHabitableZone(city) && city.foodStockpile < 50 ?
                 '<p style="font-size: 9px; color: #ff4400;">⚠️ Low food! Population dying faster!</p>' : ''}
             <div style="display: flex; gap: 5px; margin-top: 5px;">
                 <button class="action-btn" style="font-size: 9px; padding: 4px;" onclick="toggleAutoFeed(${city.id})">${city.autoFeed ? 'Disable' : 'Enable'} Auto-feed</button>
                 <button class="action-btn" style="font-size: 9px; padding: 4px;" onclick="sendFoodAid(${city.id}, 20)" ${game.resources.food < 20 ? 'disabled' : ''}>+20 Food</button>
                 <button class="action-btn" style="font-size: 9px; padding: 4px;" onclick="sendFoodAid(${city.id}, 50)" ${game.resources.food < 50 ? 'disabled' : ''}>+50 Food</button>
             </div>
         </div>`;

    const radius = document.getElementById('placement-radius');

    radius.style.left = `${city.x}%`;
    radius.style.top = `${city.y}%`;

    const mainGame = document.getElementById('main-game');
    const gameRect = mainGame.getBoundingClientRect();
    const avgDimension = (gameRect.width + gameRect.height) / 2;
    const radiusSize = (CITY_FEATURE_RADIUS / 100) * avgDimension * 2 * 10;
    radius.style.width = radius.style.height = `${radiusSize}px`;
    radius.classList.add('active');

    const panel = document.getElementById('info-panel');
    const inZone = isCityInHabitableZone(city);
    const roadBonus = getRoadBonus(city);
    const featureBonus = getCityFeatureBonus(city);
    const connectedCities = getConnectedCities(city.id);

    const rebellionText = city.isRebel ? '<p style="color: #ff4400;"><strong>REBEL!</strong></p>' : '';
    const happinessColor = city.happiness > 60 ? '#4CAF50' : (city.happiness > 30 ? '#ffaa00' : '#ff4400');

    const upgradeText = city.upgradeLevel < 2 ? `<p><strong>Fortification:</strong> Level ${city.upgradeLevel}</p>` : '<p><strong>Fortification:</strong> Max Level</p>';
    const spec = CITY_SPECIALIZATIONS[city.specialization];
    const specText = `<div style="background: rgba(100,100,255,0.1); padding: 8px; border-radius: 5px; margin: 8px 0;">
    <p style="font-size: 11px; margin-bottom: 5px;"><strong>${spec.icon} ${spec.name}</strong></p>
    <p style="font-size: 9px; opacity: 0.8;">${spec.description}</p>
    </div>`;

    const specButtons = city.specialization === 'none' && !city.isRebel ?
        `<div style="display: flex; gap: 5px; margin-top: 8px;">
        <button class="action-btn" style="font-size: 9px; padding: 4px;" onclick="setSpecialization(${city.id}, 'military')" ${!hasResources({food: 200, metal: 250, energy: 50}) ? 'disabled' : ''}>⚔️ Military (200F, 250M, 50E)</button>
        <button class="action-btn" style="font-size: 9px; padding: 4px;" onclick="setSpecialization(${city.id}, 'trade')" ${!hasResources({food: 150, metal: 200, energy: 50}) ? 'disabled' : ''}>💰 Trade (150F, 200M, 50E)</button>
        <button class="action-btn" style="font-size: 9px; padding: 4px;" onclick="setSpecialization(${city.id}, 'research')" ${!hasResources({food: 200, metal: 150, energy: 250}) ? 'disabled' : ''}>🔬 Research (200F, 150M, 250E)</button>
    </div>` : '';

    const upgradeCost = city.upgradeLevel === 0 ? {food: 100, metal: 150, energy: 50} : {food: 200, metal: 300, energy: 100};
    const upgradeBtn = city.upgradeLevel < 2 && !city.isRebel ?
        `<button class="action-btn" onclick="upgradeCity(${city.id})" ${!hasResources(upgradeCost) ? 'disabled' : ''}>Upgrade Lvl${city.upgradeLevel + 1} (${city.upgradeLevel === 0 ? '100F, 150M, 50E' : '200F, 300M, 100E'})</button>` : '';

    const migrateBtn = !city.isRebel && city.population >= 50 ?
        `<button class="action-btn" onclick="migrateFrom(${city.id})" ${!hasResources({food: 30, metal: 10, energy: 5}) ? 'disabled' : ''}>Migrate 50 (30F, 10M, 5E)</button>` : '';

    if (game.selectingAttackers) {
        const hasUnits = city.stationedUnits.infantry > 0 ||
                         city.stationedUnits.cavalry > 0 ||
                         city.stationedUnits.artillery > 0;

        if (!hasUnits) {
            addMessage('This city has no units!', 'warning');
            return;
        }

        const index = game.attackingCities.findIndex(c => c.id === city.id);
        if (index > -1) {
            game.attackingCities.splice(index, 1);
            addMessage(`Removed ${city.name} from attack`, 'info');
        } else {
            game.attackingCities.push(city);
            addMessage(`Added ${city.name} to attack`, 'success');
        }

        updateAttackersList();
        return;
    }

    let connectionsText = '';
    if (connectedCities.length > 0) {
        connectionsText = `<p style="font-size: 9px;"><strong>Connected:</strong> ${connectedCities.map(c => c.name).join(', ')}</p>`;
    }

    let featureText = '';
    if (featureBonus.nearbyFeatures.length > 0) {
        featureText = '<div style="background: rgba(0,255,0,0.05); padding: 8px; border-radius: 5px; margin: 8px 0;"><p style="font-size: 10px; color: #4CAF50; margin-bottom: 5px;"><strong>📍 Nearby Features:</strong></p>';
        featureBonus.nearbyFeatures.forEach(f => {
            const foodText = f.actualFoodBonus > 0 ? `+${f.actualFoodBonus.toFixed(1)}F` : '';
            const metalText = f.actualMetalBonus > 0 ? `+${f.actualMetalBonus.toFixed(1)}M` : '';
            const energyText = f.actualEnergyBonus > 0 ? `+${f.actualEnergyBonus.toFixed(1)}E` : '';
            const popText = f.actualGrowthPenalty !== 0 ? `${f.actualGrowthPenalty > 0 ? '+' : ''}${f.actualGrowthPenalty.toFixed(1)}pop/yr` : '';
            const effectText = [foodText, metalText, energyText, popText].filter(t => t).join(', ');
            const sharedText = f.sharedWith > 1 ? ` (shared with ${f.sharedWith - 1} ${f.sharedWith === 2 ? 'city' : 'cities'})` : '';
            featureText += `<p style="font-size: 9px; margin: 3px 0; padding-left: 10px;">• ${f.type.charAt(0).toUpperCase() + f.type.slice(1)}: ${effectText}${sharedText}</p>`;
        });
        featureText += `<p style="font-size: 9px; margin-top: 5px; font-weight: bold;">Total: +${featureBonus.foodBonus.toFixed(1)}F, +${featureBonus.metalBonus.toFixed(1)}M, +${featureBonus.energyBonus.toFixed(1)}E/yr, ${featureBonus.growthPenalty >= 0 ? '+' : ''}${featureBonus.growthPenalty.toFixed(1)}pop/yr</p></div>`;
    }

    const totalUnitsInCity = city.stationedUnits.infantry + city.stationedUnits.cavalry + city.stationedUnits.artillery;

    let stationedUnitsText = `
        <div style="background: rgba(255,170,0,0.1); padding: 8px; border-radius: 5px; margin: 8px 0;">
            <h4 style="color: #ffaa00; font-size: 12px; margin-bottom: 6px;">Military Forces</h4>
            <p style="font-size: 10px;">Infantry: ${city.stationedUnits.infantry} | Cavalry: ${city.stationedUnits.cavalry} | Artillery: ${city.stationedUnits.artillery}</p>
            <p style="font-size: 9px; margin-top: 4px;">Defense: ${city.stationedUnits.infantry * 3 + city.stationedUnits.cavalry * 5 + city.stationedUnits.artillery * 2}</p>
            <p style="font-size: 9px; margin-top: 4px;">Capacity: ${totalUnitsInCity}/8</p>
            <button class="action-btn" style="font-size: 10px; padding: 4px;" onclick="stationUnits(${city.id})" ${city.isRebel || totalUnitsInCity === 0 ? 'disabled' : ''}>Transfer Units</button>
        </div>`;

    const totalStationed = city.stationedUnits.infantry + city.stationedUnits.cavalry + city.stationedUnits.artillery;
    if (totalStationed > 4) {
        const penalty = ((totalStationed - 4) * 0.05 * 10).toFixed(1);
        stationedUnitsText += `<p style="font-size: 9px; margin-top: 4px; color: #ff4400;">Military Oppression: -${penalty} happiness/yr</p>`;
    }

panel.innerHTML = `<h3>${city.name}</h3>${upgradeText}<div class="happiness-bar"><div class="happiness-fill" style="width: ${city.happiness}%; background: ${happinessColor};"></div><div class="happiness-text">${Math.floor(city.happiness)}</div></div><p><strong>Population:</strong> ${Math.floor(city.population)}/${city.maxPopulation}</p>${rebellionText}<p><strong>Status:</strong> ${inZone ? '✓ In Zone' : '⚠ Outside!'}</p><p><strong>Road Bonus:</strong> +${(roadBonus * 100).toFixed(0)}%</p>${featureText}${connectionsText}${stationedUnitsText}${foodText}${specButtons}${upgradeBtn}${migrateBtn}`;    panel.style.display = 'block';
    document.getElementById('build-road-btn').disabled = false;
}

function setSpecialization(cityId, specType) {
    const city = game.cities.find(c => c.id === cityId);
    if (!city || city.isRebel) return;

    const spec = CITY_SPECIALIZATIONS[specType];
    if (!hasResources(spec.cost)) {
        addMessage('Not enough resources!', 'warning');
        return;
    }

    spendResources(spec.cost);
    city.specialization = specType;

    const cityEl = document.getElementById(`city-${city.id}`);
    if (cityEl) {
        cityEl.className = `city city-${city.zoneType} city-${specType}`;
        const oldBuildings = cityEl.querySelector('.city-buildings');
        if (oldBuildings) oldBuildings.remove();
        generateCityBuildings(cityEl, city);
    }

    addMessage(`${city.name} specialized as ${spec.name}!`, 'success');
    AudioManager.playSFX('sfx-success', 0.6);
    selectCity(city);
}

function updateAttackersList() {
    const container = document.getElementById('selected-attackers');
    if (!container) return;

    if (game.attackingCities.length === 0) {
        container.innerHTML = '<p style="font-size: 10px; opacity: 0.7;">No cities selected</p>';
        return;
    }

    container.innerHTML = game.attackingCities.map(city => {
        const dist = Math.sqrt(Math.pow(game.targetTribal.x - city.x, 2) +
                               Math.pow(game.targetTribal.y - city.y, 2));
        const penalty = Math.max(0, (dist - 20) * 2);
        return `<div style="font-size: 10px; padding: 4px; background: rgba(0,255,0,0.1); margin: 3px 0; border-radius: 3px;">
            ${city.name} - Distance: ${dist.toFixed(1)}% (${penalty > 0 ? `-${penalty.toFixed(0)}% ATK` : 'No penalty'})
        </div>`;
    }).join('');
    }

function cancelAttackSelection() {
game.selectingAttackers = false;
game.attackingCities = [];
game.targetTribal = null;
document.getElementById('info-panel').innerHTML = '';
}

function confirmAttack() {
    if (game.attackingCities.length === 0) {
        addMessage('Select at least one city!', 'warning');
        return;
    }

    game.selectingAttackers = false;
    game.currentBattle = game.targetTribal;
    openBattlePlanningScreen(game.targetTribal);
}

function stationUnits(cityId) {
    const city = game.cities.find(c => c.id === cityId);
    if (!city || city.isRebel) return;

    const panel = document.getElementById('info-panel');

    const otherCities = game.cities.filter(c => c.id !== cityId && !c.isRebel);
    if (otherCities.length === 0) {
        addMessage('No other cities to transfer units from!', 'warning');
        selectCity(city);
        return;
    }

    let transferUI = `<h3>Transfer Units to ${city.name}</h3>`;
    transferUI += '<p style="font-size: 10px; margin-bottom: 10px;">Select a city to transfer from:</p>';

    otherCities.forEach(source => {
        const hasUnits = source.stationedUnits.infantry > 0 || source.stationedUnits.cavalry > 0 || source.stationedUnits.artillery > 0;
        if (hasUnits) {
            transferUI += `<div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 5px; margin-bottom: 8px;">`;
            transferUI += `<p style="font-size: 11px; font-weight: bold;">${source.name}</p>`;
            transferUI += `<p style="font-size: 9px;">${source.stationedUnits.infantry} Inf, ${source.stationedUnits.cavalry} Cav, ${source.stationedUnits.artillery} Art</p>`;

            if (source.stationedUnits.infantry > 0) {
                transferUI += `<button class="action-btn" style="font-size: 9px; padding: 3px;" onclick="transferUnit(${source.id}, ${cityId}, 'infantry')">Transfer 1 Infantry</button>`;
            }
            if (source.stationedUnits.cavalry > 0) {
                transferUI += `<button class="action-btn" style="font-size: 9px; padding: 3px;" onclick="transferUnit(${source.id}, ${cityId}, 'cavalry')">Transfer 1 Cavalry</button>`;
            }
            if (source.stationedUnits.artillery > 0) {
                transferUI += `<button class="action-btn" style="font-size: 9px; padding: 3px;" onclick="transferUnit(${source.id}, ${cityId}, 'artillery')">Transfer 1 Artillery</button>`;
            }
            transferUI += `</div>`;
        }
    });

    transferUI += `<button class="action-btn" style="margin-top: 10px;" onclick="selectCity(game.cities.find(c => c.id === ${cityId}))">Done</button>`;

    panel.innerHTML = transferUI;
}

function transferUnit(fromCityId, toCityId, unitType) {
    const fromCity = game.cities.find(c => c.id === fromCityId);
    const toCity = game.cities.find(c => c.id === toCityId);

    if (!fromCity || !toCity) return;
    if (fromCity.stationedUnits[unitType] < 1) return;

    const totalUnitsInTarget = toCity.stationedUnits.infantry + toCity.stationedUnits.cavalry + toCity.stationedUnits.artillery;
    if (totalUnitsInTarget >= 8) {
        addMessage(`${toCity.name} is at max capacity (8 units)!`, 'warning');
        return;
    }

    fromCity.stationedUnits[unitType]--;
    toCity.stationedUnits[unitType]++;

    addMessage(`Transferred ${UNIT_TYPES[unitType].name}: ${fromCity.name} → ${toCity.name}`, 'success');

    updateCityUnitIcons(fromCity);
    updateCityUnitIcons(toCity);

    game.selectedCity = toCity;

    stationUnits(toCityId);
}
function upgradeCity(cityId) {
    const city = game.cities.find(c => c.id === cityId);
    if (!city || city.isRebel) return;

    const upgradeCost = city.upgradeLevel === 0 ?
        {
            food: Math.floor(100 * (1 - TechTree.getTechBonus('upgradeCost'))),
            metal: Math.floor(150 * (1 - TechTree.getTechBonus('upgradeCost'))),
            energy: Math.floor(50 * (1 - TechTree.getTechBonus('upgradeCost')))
        } :
        {
            food: Math.floor(200 * (1 - TechTree.getTechBonus('upgradeCost'))),
            metal: Math.floor(300 * (1 - TechTree.getTechBonus('upgradeCost'))),
            energy: Math.floor(100 * (1 - TechTree.getTechBonus('upgradeCost')))
        };
    if (!hasResources(upgradeCost)) {
        addMessage('Not enough resources!', 'warning');
        return;
    }

    spendResources(upgradeCost);
    city.upgradeLevel = (city.upgradeLevel || 0) + 1;

    const cityEl = document.getElementById(`city-${city.id}`);
    if (cityEl) {
        cityEl.classList.add(`city-upgraded-${city.upgradeLevel}`);
        const oldBuildings = cityEl.querySelector('.city-buildings');
        if (oldBuildings) oldBuildings.remove();
        generateCityBuildings(cityEl, city);
    }

    addMessage(`${city.name} upgraded to Level ${city.upgradeLevel}!`, 'success');
    selectCity(city);
}
function migrateFrom(cityId) {
    const fromCity = game.cities.find(c => c.id === cityId);
    if (!fromCity || fromCity.population < 50 || fromCity.isRebel) {
        addMessage('Cannot migrate from this city!', 'warning');
        return;
    }
    if (!hasResources({ food: 30, metal: 10, energy: 5 })) {
        addMessage('Not enough resources!', 'warning');
        return;
    }
    const targetCities = game.cities.filter(c => c.id !== fromCity.id && isCityInHabitableZone(c) && !c.isRebel);
    if (targetCities.length === 0) {
        addMessage('No safe cities to migrate to!', 'warning');
        return;
    }
    const target = targetCities.reduce((closest, city) => {
        const dist = Math.abs(city.position - fromCity.position);
        const closestDist = Math.abs(closest.position - fromCity.position);
        return dist < closestDist ? city : closest;
    });
    fromCity.population -= 50;
    target.population = Math.min(target.maxPopulation, target.population + 50);
    spendResources({ food: 30, metal: 10, energy: 5 });
    addMessage(`50 migrated: ${fromCity.name} → ${target.name}`, 'success');
    updateCityDisplay(fromCity);
    updateCityDisplay(target);
    selectCity(fromCity);
}

function startGame() {
    document.getElementById('tutorial').style.display = 'none';
    VictoryConditions.init();
    game.running = true;
    TechTree.init();
    usedNames = [];
    cityIdCounter = 0;
    tribalIdCounter = 0;
    roadIdCounter = 0;
    Object.assign(game, {
    cities: [], roads: [], features: [], tribalCities: [], tribalRoads: [],
    messages: [], selectedCity: null, spaceportProgress: 0, spaceportBuilding: false,
    spaceportYearStarted: 0,
    resources: { food: 500, metal: 400, energy: 250 }, year: 0,
    gatherCooldown: 0, tribalTradeCooldown: 0, tribalReputation: 50,
    tribalRelation: 'neutral', hasEmbassy: false, activeLaw: 'none',
    tribalRoadTimer: 0, tribalCityTimer: Math.random() * 50 + TRIBAL_CITY_INTERVAL_MIN,
    ddrActive: false, ddrCombo: 0, ddrBonus: 0, tribalsDefeated: false,
    tribalMilitaryWarned: false, commanderXP: 0, commanderLevel: 1,
    unlockedPerks: [], activePerks: [], scoutedTribalCities: [],
    battleFormation: 'balanced', retreatThreshold: 50, battlePhase: 0,
    battleMorale: 100, weatherEvent: null, currentBattle: null, relentlessUsed: false,
    peaceTalksActive: false, peaceTalksTimer: 0, peaceDemandsMet: 0,
    peaceDemands: [], currentPeaceDemand: null, peaceTreatyCooldown: 0, lastShownDemandIndex: -1,
    attackingCities: [],
    selectingAttackers: false,
    targetTribal: null
});


document.getElementById('planet-view').querySelectorAll('.city, .tribal-city, .road, .tribal-road, .army-arrow').forEach(el => el.remove());
document.getElementById('messages').innerHTML = '';

generateTerrainElements();
generateTribalCities();

const startingCity = {
    id: cityIdCounter++,
    name: getCityName(),
    position: 50,
    x: 50,
    y: 50,
    population: 150,
    maxPopulation: 500 + TechTree.getTechBonus('maxPopulation'),
    warned: false,
    zoneType: getZoneType(50),
    isRebel: false,
    isConverted: false,
    upgradeLevel: 0,
    happiness: 50,
    conquestRebellionTimer: 0,
    stationedUnits: { infantry: 0, cavalry: 0, artillery: 0 },
    tradeBoost: 0,
    specialization: 'none',
    foodStockpile: 50,
    foodConsumptionRate: 0,
    autoFeed: true
};

game.cities.push(startingCity);

const cityEl = document.createElement('div');
cityEl.className = `city city-${startingCity.zoneType}`;
cityEl.id = `city-${startingCity.id}`;
cityEl.style.left = '50%';
cityEl.style.top = '50%';
cityEl.style.transform = 'translate(-50%, -50%)';
cityEl.innerHTML = `<div class="city-label">${startingCity.name}</div><div class="city-icon"></div><div class="population-bar"><div class="population-fill" style="width: 30%"></div></div>`;
cityEl.onclick = (e) => {
    e.stopPropagation();
    if (game.buildingRoad && game.roadStartCity && game.roadStartCity.id !== startingCity.id) {
        createRoad(game.roadStartCity, startingCity);
        game.buildingRoad = false;
        game.roadStartCity = null;
        document.getElementById('build-road-btn').classList.remove('active');
    } else {
        selectCity(startingCity);
    }
};
generateCityBuildings(cityEl, startingCity);
document.getElementById('planet-view').appendChild(cityEl);

addMessage('Build your first city in the habitable zone!', 'info');
addMessage('Tribes will expand over time...', 'warning');
updateHabitableZone();

if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);

    applyMapTransform();
    updateMinimap();
}

function getDistanceMultiplier(x, y) {
    if (game.cities.length === 0) return 1;

    const closestDist = Math.min(...game.cities.map(city =>
        Math.sqrt(Math.pow(x - city.x, 2) + Math.pow(y - city.y, 2))
    ));

    if (closestDist <= 15) return 1;
    if (closestDist <= 30) return 1.5;
    if (closestDist <= 45) return 2;
    return 3;
}

function update() {
    if (!game.running || game.paused || game.ddrActive) return;
    VictoryConditions.checkVictory();

    if (isNaN(game.resources.food) || isNaN(game.resources.metal) || isNaN(game.resources.energy)) {
            console.trace('RESOURCES BECAME NaN! Stack trace above');
            game.paused = true;
            return;
    }

    game.year += 0.01;

    if (Math.floor(game.year * 10) % 10 === 0) {
            updateFeatureSharingIndicators();
    }

    if (game.gatherCooldown > 0) {
        game.gatherCooldown = Math.max(0, game.gatherCooldown - 0.1);
        document.getElementById('gather-cooldown').style.width = `${(game.gatherCooldown / 10) * 100}%`;
    }

    game.habitableZone.left += game.zoneShiftSpeed * 0.01;
    if (game.habitableZone.left > 70 || game.habitableZone.left < 0) {
        game.zoneShiftSpeed *= -1;
    }
    updateHabitableZone();

    if (game.spaceportBuilding) {
        const totalPop = game.cities.reduce((sum, c) => sum + c.population, 0);

        if (totalPop < 3500) {
            addMessage('Spaceport construction HALTED! Population dropped below 3500!', 'danger');
            game.spaceportBuilding = false;
            game.spaceportProgress = 0;
            AudioManager.playSFX('sfx-alert', 0.7);
        } else {
            const yearsElapsed = game.year - game.spaceportYearStarted;
            game.spaceportProgress = Math.min(100, (yearsElapsed / 10) * 100);

            if (game.spaceportProgress >= 100) {
                VictoryConditions.checkVictory();
            }
        }
    }


    tribalExpansion();
    tribalMilitaryManagement();
    checkTribalWarDeclaration();
    if (game.tribalRelation === 'war' && !game.tribalsDefeated && Math.random() < 0.01) {
        tribalCounterattack();
    }
    // 1% chance

    if (game.peaceTalksActive) {
    game.peaceTalksTimer += 0.01;

    const yearOfTalks = Math.floor(game.peaceTalksTimer);

    if (yearOfTalks < 3 && !game.currentPeaceDemand && yearOfTalks > game.lastShownDemandIndex && game.peaceTalksTimer - yearOfTalks > 0.5) {
    const demand = game.peaceDemands[yearOfTalks];
    if (demand) {
    game.currentPeaceDemand = demand;
    game.lastShownDemandIndex = yearOfTalks;
    showPeaceDemand(demand, yearOfTalks + 1);
    }
    }

    if (game.peaceTalksTimer >= 3.5) {
    concludePeaceTalks();
    }
    }


    if (game.peaceTreatyCooldown > 0) {
    game.peaceTreatyCooldown--;
    if (game.tribalReputation < 21) {
    game.tribalReputation = 21;
    }
    }

    game.cities.forEach(city => {
        if (city.conquestRebellionTimer > 0) {
            city.conquestRebellionTimer--;
            if (city.conquestRebellionTimer === 0 && city.isRebel) {
                city.isRebel = false;
                city.happiness = 50;
                addMessage(`${city.name} is now loyal!`, 'success');
                updateCityDisplay(city);
            }
            return;
        }

        if (city.isRebel) {
            city.population -= 0.3;
            updateCityDisplay(city);
            return;
        }

        const inZone = isCityInHabitableZone(city);
        const lawEffect = LAWS[game.activeLaw];
        const roadBonus = getRoadBonus(city);
        const featureBonus = getCityFeatureBonus(city);

        if (inZone) {
        if (city.happiness < 75) {
        city.happiness += 0.15;
        }
        } else {
        if (city.happiness > 25) {
        city.happiness -= 0.25;
        }
        }

        const totalStationedUnits = city.stationedUnits.infantry + city.stationedUnits.cavalry + city.stationedUnits.artillery;
        if (totalStationedUnits > 4) {
            const militaryOppression = (totalStationedUnits - 4) * 0.05;
            city.happiness -= militaryOppression;
        }

        const lawHappinessChange = lawEffect.happinessPenalty * 0.01;
        city.happiness += lawHappinessChange;

        city.happiness = Math.max(0, Math.min(100, city.happiness));

        if (city.happiness <= 0 && !city.isRebel && city.conquestRebellionTimer === 0) {
            city.isRebel = true;
            addMessage(` ${city.name} has REBELLED due to zero happiness!`, 'danger');
            AudioManager.playSFX('sfx-alert', 0.7);
        }

        if (inZone || (city.zoneType === 'hot' && city.isConverted)) {
            const foodNeeded = calculateFoodNeeds(city);
            city.foodConsumptionRate = foodNeeded;

            if (city.autoFeed && game.resources.food >= foodNeeded) {
                game.resources.food -= foodNeeded;
                city.foodStockpile = Math.min(100, city.foodStockpile + 0.5);

                if (city.foodStockpile >= 20) {
                    const baseGrowth = city.isConverted ? 0.3 : 0.5;
                    const specGrowthMod = 1 + CITY_SPECIALIZATIONS[city.specialization].growthBonus;
                    const foodBonus = Math.min(1.5, city.foodStockpile / 50);
                    const techGrowthBonus = 1 + TechTree.getTechBonus('popGrowth');
                    const growthRate = (baseGrowth + (featureBonus.growthPenalty * 0.01)) * specGrowthMod * foodBonus * techGrowthBonus;
                    city.population += growthRate;
                } else {
                    city.population += 0.1;
                }
            } else {
                city.foodStockpile = Math.max(0, city.foodStockpile - 1);
                if (city.foodStockpile < 10) {
                    city.happiness -= 0.2;
                }
            }

            const popRatio = city.population / city.maxPopulation;
            const popProductionBonus = 0.5 + (popRatio * 0.5);

            const baseRes = 0.1;
            const conversionPenalty = city.isConverted ? 0.7 : 1.0;
            const lawBonus = 1 + lawEffect.resourceBonus;
            const tradeBonus = city.tradeBoost > 0 ? 1.2 : 1.0;
            const specBonus = 1 + CITY_SPECIALIZATIONS[city.specialization].resourceBonus;
            const totalProductionMod = (1 + roadBonus) * conversionPenalty * lawBonus * tradeBonus * popProductionBonus * specBonus;
            const baseProduction = baseRes;

            if (city.specialization === 'trade') {
                const foodProd = (baseProduction + (featureBonus.foodBonus * 0.01)) * totalProductionMod * 0.4;
                const metalProd = (baseProduction + (featureBonus.metalBonus * 0.01)) * totalProductionMod * 0.3;
                const energyProd = (baseProduction + (featureBonus.energyBonus * 0.01)) * totalProductionMod * 0.3;

                game.resources.food += foodProd * (1 + TechTree.getTechBonus('foodProduction'));
                game.resources.metal += metalProd * (1 + TechTree.getTechBonus('metalProduction'));
                game.resources.energy += energyProd * (1 + TechTree.getTechBonus('energyProduction'));
            } else if (city.specialization === 'research') {
                const foodProd = (baseProduction + (featureBonus.foodBonus * 0.01)) * totalProductionMod * 0.2;
                const metalProd = (baseProduction + (featureBonus.metalBonus * 0.01)) * totalProductionMod * 0.3;
                const energyProd = (baseProduction + (featureBonus.energyBonus * 0.01)) * totalProductionMod * 0.5;
                game.researchPoints += 0.1;

                game.resources.food += foodProd * (1 + TechTree.getTechBonus('foodProduction'));
                game.resources.metal += metalProd * (1 + TechTree.getTechBonus('metalProduction'));
                game.resources.energy += energyProd * (1 + TechTree.getTechBonus('energyProduction'));
            } else if (city.specialization === 'military') {
                const foodProd = (baseProduction + (featureBonus.foodBonus * 0.01)) * totalProductionMod * 0.4;
                const metalProd = (baseProduction + (featureBonus.metalBonus * 0.01)) * totalProductionMod * 0.5;
                const energyProd = (baseProduction + (featureBonus.energyBonus * 0.01)) * totalProductionMod * 0.1;

                game.resources.food += foodProd * (1 + TechTree.getTechBonus('foodProduction'));
                game.resources.metal += metalProd * (1 + TechTree.getTechBonus('metalProduction'));
                game.resources.energy += energyProd * (1 + TechTree.getTechBonus('energyProduction'));
            } else {
                const foodProd = (baseProduction + (featureBonus.foodBonus * 0.01)) * totalProductionMod * 0.4;
                const metalProd = (baseProduction + (featureBonus.metalBonus * 0.01)) * totalProductionMod * 0.3;
                const energyProd = (baseProduction + (featureBonus.energyBonus * 0.01)) * totalProductionMod * 0.3;

                game.resources.food += foodProd * (1 + TechTree.getTechBonus('foodProduction'));
                game.resources.metal += metalProd * (1 + TechTree.getTechBonus('metalProduction'));
                game.resources.energy += energyProd * (1 + TechTree.getTechBonus('energyProduction'));
            }

            if (city.tradeBoost > 0) {
                city.tradeBoost--;
                if (city.tradeBoost === 0) {
                    addMessage(city.name + " trade boost expired", 'info');
                }
            }
        } else {
            const foodNeeded = calculateFoodNeeds(city);
            city.foodConsumptionRate = foodNeeded;

            if (city.foodStockpile > 0 && city.autoFeed && game.resources.food >= foodNeeded) {
                game.resources.food -= foodNeeded;

                const dist = getDistanceFromZone(city);
                const upgradeMultiplier = city.upgradeLevel === 0 ? 1 : (city.upgradeLevel === 1 ? 0.5 : 0.25);
                let deathRate = Math.min(1, dist / 20) * upgradeMultiplier;

                const foodProtection = Math.min(0.7, city.foodStockpile / 100);
                deathRate *= (1 - foodProtection);

                city.population -= deathRate;
                city.foodStockpile = Math.max(0, city.foodStockpile - 0.3);
            } else {
                const dist = getDistanceFromZone(city);
                const upgradeMultiplier = city.upgradeLevel === 0 ? 1 : (city.upgradeLevel === 1 ? 0.5 : 0.25);
                const deathRate = Math.min(1, dist / 20) * upgradeMultiplier;
                city.population -= deathRate;
                city.foodStockpile = Math.max(0, city.foodStockpile - 1);

                if (city.foodStockpile === 0) {
                    city.happiness -= 0.3;
                }
            }
        }

        city.population = Math.max(0, Math.min(city.population, city.maxPopulation));
        updateCityDisplay(city);
    });

    game.cities = game.cities.filter(city => {
        if (city.population <= 0) {
            addMessage(`${city.name} abandoned.`, 'danger');
            const el = document.getElementById(`city-${city.id}`);
            if (el) el.remove();
            game.roads = game.roads.filter(road => {
                if (road.from === city.id || road.to === city.id) {
                    const roadEl = document.getElementById(`road-${road.id}`);
                    if (roadEl) roadEl.remove();
                    return false;
                }
                return true;
            });
            return false;
        }
        return true;
    });

    const totalPop = game.cities.reduce((sum, c) => sum + c.population, 0);
    if (game.cities.length > 0 && totalPop <= 0) {
        gameOver('All cities abandoned. Civilization ended.');
        return;
    }

    if (game.cities.length > 0 && game.cities.every(city => city.isRebel)) {
    gameOver('All cities are in rebellion! Your civilization has collapsed.');
    return;
    }


        if (game.selectedCity && game.selectedType === 'city') {
    const selectedCity = game.cities.find(c => c.id === game.selectedCity.id);
    if (selectedCity) {
    game.selectedCity = selectedCity;
    updateCityInfoOnly(selectedCity);
    } else {
    game.selectedCity = null;
    game.selectedType = null;
    document.getElementById('info-panel').style.display = 'none';
    }
    } else if (game.selectedCity && game.selectedType === 'tribal') {
    const selectedTribal = game.tribalCities.find(t => t.id === game.selectedCity.id);
    if (selectedTribal) {
    game.selectedCity = selectedTribal;
    updateTribalInfoOnly(selectedTribal);
    } else {
    game.selectedCity = null;
    game.selectedType = null;
    document.getElementById('info-panel').style.display = 'none';
    }
    }

    if (game.ddrActive) {
    const canReinforce = canCallReinforcements();
    const reinforceBtn = document.getElementById('reinforcement-btn');
    if (reinforceBtn) {
    reinforceBtn.disabled = !canReinforce;
    const totalRes = game.resources.food + game.resources.metal + game.resources.energy;
    if (!canReinforce && totalRes < 300) {
        reinforceBtn.textContent = 'Need 300 Resources';
    } else if (!canReinforce) {
        reinforceBtn.textContent = 'No Supply Lines';
    } else {
        reinforceBtn.textContent = 'Call Reinforcements (300 res)';
    }
    }
    }
    if (Math.floor(game.year * 10) % 5 === 0) {
        updateMinimap();
    }

    updateUI();
}

function sendFoodAid(cityId, amount) {
    const city = game.cities.find(c => c.id === cityId);
    if (!city || city.isRebel) return;

    if (city.foodStockpile >= 100) {
        addMessage(`${city.name} stockpile is full!`, 'warning');
        return;
    }

    const spaceAvailable = 100 - city.foodStockpile;
    const actualAmount = Math.min(amount, spaceAvailable);

    if (!hasResources({food: actualAmount, metal: 0, energy: 0})) {
        addMessage('Not enough food!', 'warning');
        return;
    }

    spendResources({food: actualAmount, metal: 0, energy: 0});
    city.foodStockpile = Math.min(100, city.foodStockpile + actualAmount);
    addMessage(`Sent ${actualAmount} food to ${city.name}!`, 'success');
    AudioManager.playSFX('sfx-success', 0.4);
    selectCity(city);
}

function showPeaceDemand(demand, year) {
game.paused = true;
const popup = document.getElementById('peace-demand-popup');

document.getElementById('peace-demand-text').textContent = demand.text;
document.getElementById('peace-demand-consequence').textContent = demand.consequence;
document.getElementById('peace-talks-year').textContent = year;

popup.style.display = 'block';
AudioManager.playSFX('sfx-alert', 0.6);
}

function respondToPeaceDemand(accepted) {
if (accepted) {
    game.peaceDemandsMet++;
    game.currentPeaceDemand.apply();
    addMessage('Accepted tribal demand', 'info');
} else {
    addMessage('Rejected tribal demand', 'warning');
}

document.getElementById('peace-demand-popup').style.display = 'none';

const currentYear = Math.floor(game.peaceTalksTimer);
game.peaceTalksTimer = currentYear + 1.0;
game.currentPeaceDemand = null;
game.paused = false;
}

function concludePeaceTalks() {
game.peaceTalksActive = false;
game.peaceTalksTimer = 0;

if (game.peaceDemandsMet === 0) {
    addMessage('PEACE TALKS FAILED! Tribes launch massive attack!', 'danger');
    AudioManager.playSFX('sfx-alert', 0.8);

    for (let i = 0; i < 3; i++) {
        setTimeout(() => tribalCounterattack(), i * 1500);
    }
} else if (game.peaceDemandsMet === 1) {
    game.tribalRelation = 'hostile';
    game.tribalReputation = 30;
    game.peaceTreatyCooldown = 700;
    AudioManager.playBgMusic();
    addMessage('Peace achieved. Relations: HOSTILE', 'warning');
    addMessage('Peace treaty: No war for 7 years', 'info');
} else if (game.peaceDemandsMet === 2) {
    game.tribalRelation = 'neutral';
    game.tribalReputation = 50;
    game.peaceTreatyCooldown = 700;
    AudioManager.playBgMusic();
    addMessage('Peace achieved. Relations: NEUTRAL', 'success');
    addMessage('Peace treaty: No war for 7 years', 'info');
} else {
    game.tribalRelation = 'friendly';
    game.tribalReputation = 70;
    game.peaceTreatyCooldown = 700;
    AudioManager.playBgMusic();
    addMessage('Peace achieved. Relations: FRIENDLY', 'success');
    addMessage('Peace treaty: No war for 7 years', 'info');
}

game.peaceDemands = [];
game.currentPeaceDemand = null;
}

function toggleAutoFeed(cityId) {
    const city = game.cities.find(c => c.id === cityId);
    if (!city || city.isRebel) return;

    city.autoFeed = !city.autoFeed;
    addMessage(`${city.name}: Auto-feed ${city.autoFeed ? 'ON' : 'OFF'}`, 'info');
    selectCity(city);
}

function checkTribalWarDeclaration() {
if (game.tribalsDefeated || game.tribalRelation === 'war') return;

const activeTribals = game.tribalCities.filter(t => !t.isConverted);
const totalTribalForces = activeTribals.reduce((sum, t) =>
    sum + t.units.infantry + t.units.cavalry + t.units.artillery, 0
);

 if (totalTribalForces >= 50 && game.tribalReputation < 50 && game.peaceTreatyCooldown === 0) {
    const nearbyCities = game.cities.filter(city => {
        const closestTribalDist = Math.min(...activeTribals.map(tribal =>
            Math.sqrt(Math.pow(tribal.x - city.x, 2) + Math.pow(tribal.y - city.y, 2))
        ));
        return closestTribalDist < 30;
    });

    if (nearbyCities.length >= 3) {
        game.tribalRelation = 'war';
game.tribalReputation = 0;

AudioManager.playBattleMusic();

addMessage('TRIBALS DECLARE WAR! Your expansion threatens them!', 'danger');
        addMessage(`${totalTribalForces} tribal warriors mobilizing!`, 'danger');
        AudioManager.playSFX('sfx-alert', 0.8);
        AudioManager.playBattleMusic();

        game.cities.forEach(city => {
            if (!city.isRebel) {
                city.happiness = Math.max(0, city.happiness - 25);
                updateCityDisplay(city);
            }
        });

        setTimeout(() => {
            addMessage('TRIBAL INVASION INCOMING!', 'danger');
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    tribalCounterattack();
                }, i * 2000);
            }
        }, 2000);
    }
}
}

function beginBattle() {
    if (!game.currentBattle) return;

    const tribal = game.currentBattle;
    const closestCity = getClosestPlayerCity(tribal);
    if (!closestCity) return;

    document.getElementById('battle-planning').style.display = 'none';

    const activeTribals = game.tribalCities.filter(t => !t.isConverted && t.id !== tribal.id);

    activeTribals.forEach(ally => {
    const distance = Math.sqrt(Math.pow(tribal.x - ally.x, 2) + Math.pow(tribal.y - ally.y, 2));

if (distance < 25 && (ally.units.infantry > 2 || ally.units.cavalry > 1 || ally.units.artillery > 0)) {
    const currentTotal = tribal.units.infantry + tribal.units.cavalry + tribal.units.artillery;
    const spaceAvailable = Math.max(0, 8 - currentTotal);

    if (spaceAvailable === 0) {
        return;
    }

    const reinforceInf = Math.min(2, ally.units.infantry);
    const reinforceCav = Math.min(1, ally.units.cavalry);
    const reinforceArt = Math.min(1, ally.units.artillery);

    const actualInf = Math.min(reinforceInf, spaceAvailable);
    const actualCav = Math.min(reinforceCav, Math.max(0, spaceAvailable - actualInf));
    const actualArt = Math.min(reinforceArt, Math.max(0, spaceAvailable - actualInf - actualCav));

    ally.units.infantry -= actualInf;
    ally.units.cavalry -= actualCav;
    ally.units.artillery -= actualArt;

    tribal.units.infantry += actualInf;
    tribal.units.cavalry += actualCav;
    tribal.units.artillery += actualArt;

    const totalSent = actualInf + actualCav + actualArt;
    const totalBlocked = (reinforceInf - actualInf) + (reinforceCav - actualCav) + (reinforceArt - actualArt);

    if (totalSent > 0) {
        addMessage(`${ally.name} sending ${totalSent} reinforcements to ${tribal.name}!`, 'danger');
        if (totalBlocked > 0) {
            addMessage(`${tribal.name} at capacity - ${totalBlocked} units couldn't reinforce`, 'warning');
        }
    }
}
});

showArmyArrow(closestCity, tribal);

const zoneType = getZoneType(tribal.x);
const weatherRoll = Math.random();
let weatherIndex = 0;

if (zoneType === 'hot' && weatherRoll < 0.4) {
    weatherIndex = 2;
} else if (zoneType === 'cold' && weatherRoll < 0.4) {
    weatherIndex = 3;
} else if (weatherRoll < 0.3) {
    weatherIndex = 1;
} else {
    weatherIndex = 0;
}

game.weatherEvent = WEATHER_EVENTS[weatherIndex];

const avgHappiness = game.cities.reduce((sum, c) => sum + c.happiness, 0) / game.cities.length;
game.battleMorale = Math.floor(avgHappiness);

const attackingCities = game.attackingCities.length > 0 ? game.attackingCities : [closestCity];
const maxDistance = Math.max(...attackingCities.map(city =>
Math.sqrt(Math.pow(tribal.x - city.x, 2) + Math.pow(tribal.y - city.y, 2))
));
const maxUnits = Math.max(...attackingCities.map(city =>
city.stationedUnits.infantry + city.stationedUnits.cavalry + city.stationedUnits.artillery
));
const travelTime = Math.max(2000, Math.min(5000, maxDistance * 80 + maxUnits * 100));

setTimeout(() => {
startEnhancedDDRBattle(tribal);
}, travelTime);
}


function updateCityInfoOnly(city) {
    const popBar = document.querySelector('.population-fill');
    if (popBar) {
        const popPercent = (city.population / city.maxPopulation) * 100;
        popBar.style.width = `${popPercent}%`;
    }

    const happinessBar = document.querySelector('.happiness-fill');
    const happinessText = document.querySelector('.happiness-text');
    if (happinessBar && happinessText) {
        happinessBar.style.width = `${city.happiness}%`;
        happinessText.textContent = Math.floor(city.happiness);
        const happinessColor = city.happiness > 60 ? '#4CAF50' : (city.happiness > 30 ? '#ffaa00' : '#ff4400');
        happinessBar.style.background = happinessColor;
    }

    const foodColor = city.foodStockpile > 50 ? '#4CAF50' : (city.foodStockpile > 20 ? '#ffaa00' : '#ff4400');
    const foodFillBar = document.querySelector('#info-panel .food-stockpile-fill');
    if (foodFillBar) {
        foodFillBar.style.width = `${city.foodStockpile}%`;
        foodFillBar.style.background = foodColor;
    }

    const inZone = isCityInHabitableZone(city);
    const statusElements = document.querySelectorAll('#info-panel p');
    statusElements.forEach(el => {
        if (el.innerHTML.includes('<strong>Population:</strong>')) {
            el.innerHTML = `<strong>Population:</strong> ${Math.floor(city.population)}/${city.maxPopulation}`;
        } else if (el.innerHTML.includes('<strong>Status:</strong>')) {
            el.innerHTML = `<strong>Status:</strong> ${inZone ? '✓ In Zone' : '⚠ Outside!'}`;
        } else if (el.classList && el.classList.contains('food-stockpile-text')) {
            el.innerHTML = `Stockpile: ${Math.floor(city.foodStockpile)}/100`;
        } else if (el.classList && el.classList.contains('food-consumption-text')) {
            el.innerHTML = `Consumption: ${city.foodConsumptionRate.toFixed(2)}/tick`;
        } else if (el.classList && el.classList.contains('food-autofeed-text')) {
            el.innerHTML = `Auto-feed: ${city.autoFeed ? '✓ ON' : '✗ OFF'}`;
        }
    });
}

function updateTribalInfoOnly(tribal) {
const statusElements = document.querySelectorAll('#info-panel p');

const isWartime = game.tribalRelation === 'war';
const isScouted = isTribalScouted(tribal.id);

statusElements.forEach(el => {
    if (el.innerHTML.includes('<strong>Population:</strong>')) {
        el.innerHTML = `<strong>Population:</strong> ${Math.floor(tribal.population)}`;
    } else if (el.innerHTML.includes('<strong>Forces:</strong>')) {
        if (!isWartime || isScouted) {
            el.innerHTML = `<strong>Forces:</strong> ${tribal.units.infantry} Inf, ${tribal.units.cavalry} Cav, ${tribal.units.artillery} Art`;
        } else {
            el.innerHTML = `<strong>Forces:</strong> <span style="color: #ff4400;">Unknown (Scout to reveal)</span>`;
        }
    }
});
}


function tribalMilitaryManagement() {
if (game.tribalsDefeated) return;
game.tribalCities.forEach(tribal => {
if (!tribal.isConverted) {
    updateTribalUnitIcons(tribal);
}
});
const activeTribals = game.tribalCities.filter(t => !t.isConverted);
if (activeTribals.length === 0) return;

activeTribals.forEach(tribal => {
tribal.population += 0.2;

const totalUnits = tribal.units.infantry + tribal.units.cavalry + tribal.units.artillery;

const isWartime = game.tribalRelation === 'war';
const maxRecruitmentsPerYear = isWartime ? 12 : 3;
const recruitChance = isWartime ? 0.009 : 0.003;

if (!tribal.recruitmentCount) tribal.recruitmentCount = 0;
if (!tribal.yearTracker) tribal.yearTracker = Math.floor(game.year);

if (Math.floor(game.year) > tribal.yearTracker) {
    tribal.recruitmentCount = 0;
    tribal.yearTracker = Math.floor(game.year);
}

if (Math.random() < recruitChance &&
tribal.population >= 80 &&
totalUnits < 8 &&
tribal.recruitmentCount < maxRecruitmentsPerYear) {

    const recruitType = Math.random();
    let unitType, popCost, unitName;

    if (recruitType < 0.5) {
        unitType = 'infantry';
        popCost = 50;
        unitName = 'Infantry';
    } else if (recruitType < 0.8) {
        unitType = 'cavalry';
        popCost = 80;
        unitName = 'Cavalry';
    } else {
        unitType = 'artillery';
        popCost = 30;
        unitName = 'Artillery';
    }

    if (tribal.population >= popCost + 50) {
        tribal.population -= popCost;
        tribal.units[unitType]++;
        tribal.recruitmentCount++;

        const newTotal = tribal.units.infantry + tribal.units.cavalry + tribal.units.artillery;
        addMessage(`${tribal.name} recruited ${unitName}! (Total: ${newTotal})`, 'warning');
        updateTribalUnitIcons(tribal);
    }
}
});

if (game.cities.length > 0 && !game.tribalMilitaryWarned) {
    const frontlineTribals = activeTribals.filter(tribal => {
        const closestDist = Math.min(...game.cities.map(city =>
            Math.sqrt(Math.pow(tribal.x - city.x, 2) + Math.pow(tribal.y - city.y, 2))
        ));
        return closestDist < 30;
    });

    if (frontlineTribals.length > 0) {
        frontlineTribals.forEach(frontline => {
            activeTribals.forEach(other => {
                if (other.id !== frontline.id && Math.random() < 0.3) {
                    const transferInf = Math.floor(other.units.infantry * 0.3);
                    const transferCav = Math.floor(other.units.cavalry * 0.3);
                    const transferArt = Math.floor(other.units.artillery * 0.3);

                    if (transferInf > 0 || transferCav > 0 || transferArt > 0) {
                        other.units.infantry -= transferInf;
                        other.units.cavalry -= transferCav;
                        other.units.artillery -= transferArt;

const currentFrontlineUnits = frontline.units.infantry + frontline.units.cavalry + frontline.units.artillery;
const canAccept = Math.max(0, 8 - currentFrontlineUnits);

const actualTransferInf = Math.min(transferInf, canAccept);
const actualTransferCav = Math.min(transferCav, Math.max(0, canAccept - actualTransferInf));
const actualTransferArt = Math.min(transferArt, Math.max(0, canAccept - actualTransferInf - actualTransferCav));

frontline.units.infantry += actualTransferInf;
frontline.units.cavalry += actualTransferCav;
frontline.units.artillery += actualTransferArt;
                    }
                }
            });
        });

        game.tribalMilitaryWarned = true;
        addMessage('Tribal forces repositioning near your borders!', 'warning');
        AudioManager.playSFX('sfx-alert', 0.6);
    }
}
}


    function generateTerrainElements() {
        const container = document.getElementById('terrain-container');
        container.innerHTML = '';

        for (let i = 0; i < 15; i++) {
            const sand = document.createElement('div');
            sand.className = 'sand-particle';
            const size = Math.random() * 20 + 10;
            sand.style.width = sand.style.height = `${size}px`;
            sand.style.left = `${Math.random() * 30}%`;
            sand.style.top = `${Math.random() * 100}%`;
            sand.style.animationDelay = `${Math.random() * 15}s`;
            container.appendChild(sand);
        }

        for (let i = 0; i < 8; i++) {
            const mountain = document.createElement('div');
            mountain.className = 'mountain';
            mountain.style.left = `${Math.random() * 60 + 5}%`;
            mountain.style.bottom = `${Math.random() * 30}%`;
            mountain.style.transform = `scale(${Math.random() * 0.5 + 0.7})`;
            container.appendChild(mountain);
        }

        for (let i = 0; i < 12; i++) {
            const ice = document.createElement('div');
            ice.className = 'ice-particle';
            const size = Math.random() * 15 + 8;
            ice.style.width = ice.style.height = `${size}px`;
            ice.style.left = `${Math.random() * 30 + 68}%`;
            ice.style.top = `${Math.random() * 100}%`;
            ice.style.animationDelay = `${Math.random() * 20}s`;
            container.appendChild(ice);
        }

        for (let i = 0; i < 6; i++) {
            const iceMountain = document.createElement('div');
            iceMountain.className = 'ice-mountain';
            iceMountain.style.left = `${Math.random() * 25 + 70}%`;
            iceMountain.style.bottom = `${Math.random() * 30}%`;
            iceMountain.style.transform = `scale(${Math.random() * 0.5 + 0.8})`;
            container.appendChild(iceMountain);
        }

        for (let i = 0; i < 5; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.style.width = `${Math.random() * 80 + 60}px`;
            cloud.style.height = `${Math.random() * 30 + 20}px`;
            cloud.style.left = `${Math.random() * 100}%`;
            cloud.style.top = `${Math.random() * 80 + 10}%`;
            cloud.style.animationDuration = `${Math.random() * 20 + 30}s`;
            cloud.style.animationDelay = `${Math.random() * 10}s`;
            container.appendChild(cloud);
        }

        generateResourceFeatures();
}

function generateResourceFeatures() {
game.features = [];

for (let i = 0; i < 30; i++) {
    const x = Math.random() * 25 + 5;
    const y = Math.random() * 80 + 10;
    const rand = Math.random();
    let type, foodBonus, metalBonus, energyBonus, growthPenalty;

    if (rand > 0.9) {
        type = 'volcano';
        foodBonus = 0;
        metalBonus = 15;
        energyBonus = 10;
        growthPenalty = -3;
    } else if (rand > 0.8) {
        type = 'oasis';
        foodBonus = 12;
        metalBonus = 0;
        energyBonus = 3;
        growthPenalty = 2;
    } else if (rand > 0.7) {
        type = 'ruins';
        foodBonus = 3;
        metalBonus = 8;
        energyBonus = 8;
        growthPenalty = 0;
    } else if (rand > 0.55) {
        type = 'quarry';
        foodBonus = 0;
        metalBonus = 12;
        energyBonus = 0;
        growthPenalty = -1;
    } else if (rand > 0.4) {
        type = 'canyon';
        foodBonus = 0;
        metalBonus = 8;
        energyBonus = 2;
        growthPenalty = 0;
    } else {
        type = 'desert';
        foodBonus = 0;
        metalBonus = 0;
        energyBonus = 0;
        growthPenalty = -2;
    }

    game.features.push({ type, x, y, foodBonus, metalBonus, energyBonus, growthPenalty });
    createFeatureElement(game.features[game.features.length - 1]);
}

for (let i = 0; i < 40; i++) {
    const x = Math.random() * 35 + 30;
    const y = Math.random() * 80 + 10;
    const rand = Math.random();
    let type, foodBonus, metalBonus, energyBonus, growthPenalty;

    if (rand > 0.92) {
        type = 'grove';
        foodBonus = 15;
        metalBonus = 0;
        energyBonus = 5;
        growthPenalty = 0;
    } else if (rand > 0.84) {
        type = 'geothermal';
        foodBonus = 0;
        metalBonus = 5;
        energyBonus = 15;
        growthPenalty = 0;
    } else if (rand > 0.76) {
        type = 'orchard';
        foodBonus = 10;
        metalBonus = 0;
        energyBonus = 2;
        growthPenalty = 1;
    } else if (rand > 0.68) {
        type = 'mine';
        foodBonus = 0;
        metalBonus = 10;
        energyBonus = 3;
        growthPenalty = -1;
    } else if (rand > 0.58) {
        type = 'lake';
        foodBonus = 10;
        metalBonus = 0;
        energyBonus = 5;
        growthPenalty = 0;
    } else if (rand > 0.45) {
        type = 'forest';
        foodBonus = 5;
        metalBonus = 3;
        energyBonus = 0;
        growthPenalty = 0;
    } else if (rand > 0.3) {
        type = 'plains';
        foodBonus = 4;
        metalBonus = 2;
        energyBonus = 0;
        growthPenalty = 1;
    } else {
        type = 'meadow';
        foodBonus = 8;
        metalBonus = 1;
        energyBonus = 1;
        growthPenalty = 2;
    }

    game.features.push({ type, x, y, foodBonus, metalBonus, energyBonus, growthPenalty });
    createFeatureElement(game.features[game.features.length - 1]);
}

for (let i = 0; i < 25; i++) {
    const x = Math.random() * 30 + 65;
    const y = Math.random() * 80 + 10;
    const rand = Math.random();
    let type, foodBonus, metalBonus, energyBonus, growthPenalty;

    if (rand > 0.85) {
        type = 'crystalcave';
        foodBonus = 0;
        metalBonus = 5;
        energyBonus = 12;
        growthPenalty = 0;
    } else if (rand > 0.7) {
        type = 'glacier';
        foodBonus = 5;
        metalBonus = 0;
        energyBonus = 8;
        growthPenalty = -2;
    } else if (rand > 0.55) {
        type = 'tundra';
        foodBonus = 3;
        metalBonus = 4;
        energyBonus = 3;
        growthPenalty = -1;
    } else {
        type = 'ice';
        foodBonus = 0;
        metalBonus = 3;
        energyBonus = 2;
        growthPenalty = 0;
    }

    game.features.push({ type, x, y, foodBonus, metalBonus, energyBonus, growthPenalty });
    createFeatureElement(game.features[game.features.length - 1]);
    }
}

    function createFeatureElement(feature) {
        console.log('Creating feature:', feature.type, 'at', feature.x, feature.y);
        const container = document.getElementById('terrain-container');
        let el;

        if (feature.type === 'lake') {
            el = document.createElement('div');
            el.className = 'lake-feature';
        } else if (feature.type === 'forest') {
            el = document.createElement('div');
            el.className = 'forest-feature';
            for (let i = 0; i < 5; i++) {
                const tree = document.createElement('div');
                tree.className = 'tree';
                tree.style.left = `${i * 12}px`;
                tree.style.top = `${Math.random() * 10 + 15}px`;
                el.appendChild(tree);
            }
        } else if (feature.type === 'canyon') {
            el = document.createElement('div');
            el.className = 'canyon-feature';
        } else if (feature.type === 'ice') {
            el = document.createElement('div');
            el.className = 'ice-feature';
        } else if (feature.type === 'desert') {
            el = document.createElement('div');
            el.className = 'desert-feature';
        } else if (feature.type === 'plains') {
            el = document.createElement('div');
            el.className = 'plains-feature';
        } else if (feature.type === 'grove') {
            el = document.createElement('div');
            el.className = 'grove-feature';
            for (let i = 0; i < 6; i++) {
                const tree = document.createElement('div');
                tree.className = 'grove-tree';
                tree.style.left = `${(i % 3) * 18}px`;
                tree.style.top = `${Math.floor(i / 3) * 20 + 5}px`;
                el.appendChild(tree);
            }
        } else if (feature.type === 'volcano') {
            el = document.createElement('div');
            el.className = 'volcano-feature';
        } else if (feature.type === 'oasis') {
            el = document.createElement('div');
            el.className = 'oasis-feature';
        } else if (feature.type === 'ruins') {
            el = document.createElement('div');
            el.className = 'ruins-feature';
        } else if (feature.type === 'quarry') {
            el = document.createElement('div');
            el.className = 'quarry-feature';
        } else if (feature.type === 'geothermal') {
            el = document.createElement('div');
            el.className = 'geothermal-feature';
        } else if (feature.type === 'orchard') {
            el = document.createElement('div');
            el.className = 'orchard-feature';
        } else if (feature.type === 'mine') {
            el = document.createElement('div');
            el.className = 'mine-feature';
        } else if (feature.type === 'meadow') {
            el = document.createElement('div');
            el.className = 'meadow-feature';
        } else if (feature.type === 'crystalcave') {
            el = document.createElement('div');
            el.className = 'crystalcave-feature';
        } else if (feature.type === 'glacier') {
            el = document.createElement('div');
            el.className = 'glacier-feature';
        } else if (feature.type === 'tundra') {
            el = document.createElement('div');
            el.className = 'tundra-feature';
        }

        el.style.left = `${feature.x}%`;
        el.style.top = `${feature.y}%`;
        el.style.transform = 'translate(-50%, -50%)';
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';

        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '-25px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.background = 'rgba(0,0,0,0.8)';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '3px 8px';
        tooltip.style.borderRadius = '3px';
        tooltip.style.fontSize = '9px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '100';

        if (feature.type === 'lake') {
            tooltip.textContent = 'Lake: +10F, +5E';
        } else if (feature.type === 'forest') {
            tooltip.textContent = 'Forest: +5F, +3M';
        } else if (feature.type === 'canyon') {
            tooltip.textContent = 'Canyon: +8M, +2E';
        } else if (feature.type === 'ice') {
            tooltip.textContent = 'Ice: +3M, +2E';
        } else if (feature.type === 'desert') {
            tooltip.textContent = 'Desert: -2 pop growth';
        } else if (feature.type === 'plains') {
            tooltip.textContent = 'Plains: +4F, +2M, +1pop';
        } else if (feature.type === 'grove') {
            tooltip.textContent = 'Sacred Grove: +15F, +5E';
        } else if (feature.type === 'volcano') {
            tooltip.textContent = 'Volcano: +15M, +10E, -3pop';
        } else if (feature.type === 'oasis') {
            tooltip.textContent = 'Oasis: +12F, +3E, +2pop';
        } else if (feature.type === 'ruins') {
            tooltip.textContent = 'Ancient Ruins: +3F, +8M, +8E';
        } else if (feature.type === 'quarry') {
            tooltip.textContent = 'Quarry: +12M, -1pop';
        } else if (feature.type === 'geothermal') {
            tooltip.textContent = 'Geothermal Vent: +5M, +15E';
        } else if (feature.type === 'orchard') {
            tooltip.textContent = 'Orchard: +10F, +2E, +1pop';
        } else if (feature.type === 'mine') {
            tooltip.textContent = 'Mine: +10M, +3E, -1pop';
        } else if (feature.type === 'meadow') {
            tooltip.textContent = 'Meadow: +8F, +1M, +1E, +2pop';
        } else if (feature.type === 'crystalcave') {
            tooltip.textContent = 'Crystal Cave: +5M, +12E';
        } else if (feature.type === 'glacier') {
            tooltip.textContent = 'Glacier: +5F, +8E, -2pop';
        } else if (feature.type === 'tundra') {
            tooltip.textContent = 'Tundra: +3F, +4M, +3E, -1pop';
        } else {
            tooltip.textContent = feature.type;
        }

        el.appendChild(tooltip);
        el.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
        el.addEventListener('mouseleave', () => tooltip.style.opacity = '0');
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'help';

        if (!el) {
            console.warn('Unknown feature type:', feature.type);
            return;
        }
        console.log('Successfully created:', feature.type);

        container.appendChild(el);

    }

function createCity(x, y) {
    const distMult = getDistanceMultiplier(x, y);
    const cityCost = {
        food: Math.floor(200 * distMult * (1 - TechTree.getTechBonus('cityCost'))),
        metal: Math.floor(200 * distMult * (1 - TechTree.getTechBonus('cityCost'))),
        energy: Math.floor(100 * distMult * (1 - TechTree.getTechBonus('cityCost')))
    };

    if (!hasResources(cityCost)) {
        addMessage(`City costs ${cityCost.food}F, ${cityCost.metal}M, ${cityCost.energy}E at this distance!`, 'warning');
        return;
    }

    const city = {
        id: cityIdCounter++,
        name: getCityName(),
        position: x, x, y,
        population: 100,
        maxPopulation: 500 + TechTree.getTechBonus('maxPopulation'),
        warned: false,
        zoneType: getZoneType(x),
        isRebel: false,
        isConverted: false,
        upgradeLevel: 0,
        happiness: 50,
        conquestRebellionTimer: 0,
        stationedUnits: { infantry: 0, cavalry: 0, artillery: 0 },
        tradeBoost: 0,
        specialization: 'none',
        foodStockpile: 50,
        foodConsumptionRate: 0,
        autoFeed: true
    };


const activeTribals = game.tribalCities.filter(t => !t.isConverted);
activeTribals.forEach(tribal => {
    const distance = Math.sqrt(Math.pow(x - tribal.x, 2) + Math.pow(y - tribal.y, 2));
    if (distance < 10) {
        game.tribalReputation = Math.max(0, game.tribalReputation - 10);
        addMessage(`${tribal.name} angered by close settlement! (-10 rep)`, 'danger');
        AudioManager.playSFX('sfx-alert', 0.6);
    }
});

game.cities.push(city);
spendResources(cityCost);
console.log('RIGHT AFTER spendResources in createCity:', game.resources);
AudioManager.playSFX('sfx-city-build', 0.6);


        const cityEl = document.createElement('div');
        cityEl.className = `city city-${city.zoneType}`;
        cityEl.id = `city-${city.id}`;
        cityEl.style.left = `${x}%`;
        cityEl.style.top = `${y}%`;
        cityEl.style.transform = 'translate(-50%, -50%)';
        cityEl.innerHTML = `<div class="city-label">${city.name}</div><div class="population-bar"><div class="population-fill" style="width: 20%"></div></div>`;
        cityEl.onclick = (e) => {
e.stopPropagation();
if (game.buildingRoad && game.roadStartCity && game.roadStartCity.id !== city.id) {
    createRoad(game.roadStartCity, city);
    game.buildingRoad = false;
    game.roadStartCity = null;
    document.getElementById('build-road-btn').classList.remove('active');
} else {
    selectCity(city);
}
};

generateCityBuildings(cityEl, city);

document.getElementById('planet-view').appendChild(cityEl);

        addMessage(`${city.name} founded!`, 'success');
        updateCityDisplay(city);
        updateBuildCityButtonText(0, 0);
    }


function generateCityBuildings(cityEl, city) {
const buildingsContainer = document.createElement('div');
buildingsContainer.className = 'city-buildings';

const buildings = [];
const baseCount = 5;
const specCount = city.specialization === 'none' ? 0 : 3;
const upgradeCount = city.upgradeLevel * 2;
const totalBuildings = baseCount + specCount + upgradeCount;

for (let i = 0; i < totalBuildings; i++) {
    const building = document.createElement('div');
    building.className = 'building';

    const angle = (i / totalBuildings) * Math.PI * 2;
    const radius = 12 + Math.random() * 8;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const width = 4 + Math.random() * 4;
    const height = 6 + Math.random() * 8;

    building.style.width = `${width}px`;
    building.style.height = `${height}px`;
    building.style.left = `${20 + x}px`;
    building.style.top = `${20 + y}px`;

    if (city.specialization === 'military') {
        if (i % 3 === 0) {
            building.style.height = `${height * 1.3}px`;
            building.style.borderTop = '3px solid #8B0000';
        }
    } else if (city.specialization === 'trade') {
        building.style.background = 'linear-gradient(to bottom, #DAA520, #B8860B)';
        if (i % 4 === 0) {
            building.style.borderTop = '2px solid #FFD700';
        }
    } else if (city.specialization === 'research') {
        building.style.background = 'linear-gradient(to bottom, #4169E1, #1E90FF)';
        if (i % 3 === 0) {
            building.style.height = `${height * 1.2}px`;
            building.style.boxShadow = '0 0 5px rgba(65, 105, 225, 0.8)';
        }
    }

    buildingsContainer.appendChild(building);
}

if (city.upgradeLevel > 0) {
    const walls = document.createElement('div');
    walls.className = 'city-walls';

    const positions = [
        { left: '-5px', top: '-5px' },
        { right: '-5px', top: '-5px' },
        { left: '-5px', bottom: '-5px' },
        { right: '-5px', bottom: '-5px' }
    ];

    positions.forEach(pos => {
        const tower = document.createElement('div');
        tower.className = 'city-tower';
        Object.assign(tower.style, pos);
        walls.appendChild(tower);
    });

    buildingsContainer.appendChild(walls);
}

if (city.specialization !== 'none') {
    const icon = document.createElement('div');
    icon.className = 'specialization-icon';
    const icons = {
        military: '⚔️',
        trade: '💰',
        research: '🔬'
    };
    icon.textContent = icons[city.specialization];
    buildingsContainer.appendChild(icon);
}

if (city.specialization === 'trade' || city.specialization === 'research') {
    for (let i = 0; i < 3; i++) {
        const smoke = document.createElement('div');
        smoke.className = 'city-smoke';
        smoke.style.left = `${15 + Math.random() * 10}px`;
        smoke.style.top = `${10 + Math.random() * 10}px`;
        smoke.style.animationDelay = `${i * 1}s`;
        buildingsContainer.appendChild(smoke);
    }
}

const glow = document.createElement('div');
glow.className = 'city-glow';
buildingsContainer.appendChild(glow);

cityEl.insertBefore(buildingsContainer, cityEl.firstChild);
}


function gatherResources() {
    if (game.gatherCooldown > 0) return;
    game.resources.food += 3;
    game.resources.metal += 1;
    game.resources.energy += 1;
    game.gatherCooldown = 10;
    AudioManager.playSFX('sfx-resource-gather', 0.4);
}

function hasResources(cost) {
    if (typeof cost === 'number') {
        const total = game.resources.food + game.resources.metal + game.resources.energy;
        return total >= cost;
    }
    return game.resources.food >= (cost.food || 0) &&
           game.resources.metal >= (cost.metal || 0) &&
           game.resources.energy >= (cost.energy || 0);
}

function spendResources(cost) {
    console.log('BEFORE spending:', JSON.stringify(game.resources), 'cost:', cost);

    if (typeof cost === 'number') {
        let remaining = cost;
        const toSpend = { food: 0, metal: 0, energy: 0 };

        ['food', 'metal', 'energy'].forEach(type => {
            if (remaining > 0) {
                const spend = Math.min(game.resources[type], remaining);
                toSpend[type] = spend;
                remaining -= spend;
            }
        });

        game.resources.food -= toSpend.food;
        game.resources.metal -= toSpend.metal;
        game.resources.energy -= toSpend.energy;
        return true;
    }

    if (!hasResources(cost)) return false;
    console.log('About to subtract - cost:', cost);
    console.log('Current resources:', game.resources.food, game.resources.metal, game.resources.energy);
    game.resources.food -= (cost.food || 0);
    console.log('After food subtraction:', game.resources.food);
    game.resources.metal -= (cost.metal || 0);
    console.log('After metal subtraction:', game.resources.metal);
    game.resources.energy -= (cost.energy || 0);
    console.log('After energy subtraction:', game.resources.energy);
    console.log('AFTER all subtractions complete:', game.resources.food, game.resources.metal, game.resources.energy);
    return true;
}

function updateBuildCityButtonText(x, y) {
    const btn = document.getElementById('build-city-btn');
    if (!game.placingCity) {
        btn.textContent = 'Place City (200F, 200M, 100E)';
        return;
    }

    const distMult = getDistanceMultiplier(x, y);
    const cost = {
        food: Math.floor(200 * distMult),
        metal: Math.floor(200 * distMult),
        energy: Math.floor(100 * distMult)
    };

    const canAfford = hasResources(cost);
    const validLocation = canPlaceCityAt(x, y);

    let text = `Place City (${cost.food}F, ${cost.metal}M, ${cost.energy}E)`;
    if (distMult > 1) {
        text += ` [${distMult}x distance]`;
    }
    if (!canAfford) {
        text += ' - NOT ENOUGH RESOURCES';
    } else if (!validLocation) {
        text += ' - TOO CLOSE';
    }

    btn.textContent = text;
}

function startCityPlacement() {
    const baseCost = { food: 200, metal: 200, energy: 100 };
    if (!hasResources(baseCost)) {
        AudioManager.playSFX('sfx-error', 0.4);
        addMessage('Not enough resources!', 'warning');
        return;
    }
    game.placingCity = true;
    game.buildingRoad = false;
    game.roadStartCity = null;
    document.getElementById('planet-view').classList.add('placing-city');
    document.getElementById('build-city-btn').classList.add('active');
    document.getElementById('build-road-btn').classList.remove('active');
    addMessage('Base cost: 200F, 200M, 100E. Cost increases with distance from cities!', 'info');
}

function cancelCityPlacement() {
    game.placingCity = false;
    document.getElementById('planet-view').classList.remove('placing-city');
    document.getElementById('build-city-btn').classList.remove('active');
    document.getElementById('placement-preview').classList.remove('active');
    document.getElementById('placement-radius').classList.remove('active');
    updateBuildCityButtonText(0, 0);
}

function canPlaceCityAt(x, y) {
    return !game.cities.some(city => {
        const dist = Math.sqrt(Math.pow(x - city.x, 2) + Math.pow(y - city.y, 2));
        return dist < MIN_CITY_DISTANCE;
    });
}

function tribalCounterattack() {
const activeTribals = game.tribalCities.filter(t => !t.isConverted);
if (activeTribals.length === 0) return;

const vulnerableCities = game.cities.filter(c =>
    !c.isRebel && (c.population > 200 || !isCityInHabitableZone(c))
);

if (vulnerableCities.length === 0) return;

const target = vulnerableCities.reduce((weakest, city) =>
    city.population < weakest.population ? city : weakest
);

const attackersInRange = activeTribals.filter(tribal => {
    const distance = Math.sqrt(Math.pow(tribal.x - target.x, 2) + Math.pow(tribal.y - target.y, 2));
    return distance <= 30 && (tribal.units.infantry > 0 || tribal.units.cavalry > 0 || tribal.units.artillery > 0);
});

if (attackersInRange.length === 0) return;

addMessage(`🚨 COORDINATED TRIBAL ASSAULT on ${target.name}!`, 'danger');
addMessage(`${attackersInRange.length} tribal cities attacking your weakest city!`, 'danger');
AudioManager.playSFX('sfx-alert', 0.8);

attackersInRange.forEach((attacker, index) => {
    showTribalAttackArrow(attacker, target);

    setTimeout(() => {
        const tribalAttack = attacker.units.infantry * 5 + attacker.units.cavalry * 12 + attacker.units.artillery * 20;
        const tribalDefense = attacker.units.infantry * 3 + attacker.units.cavalry * 5 + attacker.units.artillery * 2;

        const cityAttack = target.stationedUnits.infantry * 5 + target.stationedUnits.cavalry * 12 + target.stationedUnits.artillery * 20;
        const cityDefense = (target.stationedUnits.infantry * 3 + target.stationedUnits.cavalry * 5 + target.stationedUnits.artillery * 2) + (target.population * 0.5) + (target.upgradeLevel * 50);

        const damageToCity = Math.max(0, tribalAttack - cityDefense * 0.3);
        const damageToTribals = Math.max(0, cityAttack - tribalDefense * 0.3);

        const tribalCasualties = Math.floor(damageToTribals / 15);
        let remainingCasualties = tribalCasualties;

        if (attacker.units.artillery > 0 && remainingCasualties > 0) {
            const artLost = Math.min(attacker.units.artillery, Math.ceil(remainingCasualties * 0.3));
            attacker.units.artillery -= artLost;
            remainingCasualties -= artLost;
        }
        if (attacker.units.cavalry > 0 && remainingCasualties > 0) {
            const cavLost = Math.min(attacker.units.cavalry, Math.ceil(remainingCasualties * 0.4));
            attacker.units.cavalry -= cavLost;
            remainingCasualties -= cavLost;
        }
        if (attacker.units.infantry > 0 && remainingCasualties > 0) {
            const infLost = Math.min(attacker.units.infantry, remainingCasualties);
            attacker.units.infantry -= infLost;
        }

        const cityCasualties = Math.floor(damageToCity / 8);
        remainingCasualties = cityCasualties;

        if (target.stationedUnits.artillery > 0 && remainingCasualties > 0) {
            const artLost = Math.min(target.stationedUnits.artillery, Math.ceil(remainingCasualties * 0.3));
            target.stationedUnits.artillery -= artLost;
            remainingCasualties -= artLost;
        }
        if (target.stationedUnits.cavalry > 0 && remainingCasualties > 0) {
            const cavLost = Math.min(target.stationedUnits.cavalry, Math.ceil(remainingCasualties * 0.4));
            target.stationedUnits.cavalry -= cavLost;
            remainingCasualties -= cavLost;
        }
        if (target.stationedUnits.infantry > 0 && remainingCasualties > 0) {
            const infLost = Math.min(target.stationedUnits.infantry, remainingCasualties);
            target.stationedUnits.infantry -= infLost;
        }

        const initialPop = target.population;
        target.population -= damageToCity;
        target.happiness = Math.max(0, target.happiness - 10);

        const popLost = Math.floor(initialPop - target.population);

        if (target.population <= 0) {
            addMessage(`${target.name} CONQUERED by ${attacker.name}!`, 'danger');

            const el = document.getElementById(`city-${target.id}`);
            if (el) el.remove();
            game.cities = game.cities.filter(c => c.id !== target.id);
            game.roads = game.roads.filter(road => {
                if (road.from === target.id || road.to === target.id) {
                    const roadEl = document.getElementById(`road-${road.id}`);
                    if (roadEl) roadEl.remove();
                    return false;
                }
                return true;
            });
        } else if (index === attackersInRange.length - 1) {
            addMessage(`${target.name} survived the assault!`, 'success');
            addMessage(`Survivors: ${Math.floor(target.population)}/${target.maxPopulation}`, 'info');
            updateCityDisplay(target);
        }
    }, 3000);
});
}

function showTribalAttackArrow(fromTribal, toCity) {
const totalUnits = fromTribal.units.infantry + fromTribal.units.cavalry + fromTribal.units.artillery;
const distance = Math.sqrt(Math.pow(toCity.x - fromTribal.x, 2) + Math.pow(toCity.y - fromTribal.y, 2));
const travelTime = Math.max(2000, Math.min(5000, distance * 80 + totalUnits * 100));

const arrow = document.createElement('div');
arrow.className = 'army-arrow';

const fromEl = document.getElementById(`tribal-${fromTribal.id}`);
const toEl = document.getElementById(`city-${toCity.id}`);
if (!fromEl || !toEl) return;

const rect1 = fromEl.getBoundingClientRect();
const rect2 = toEl.getBoundingClientRect();
const planetRect = document.getElementById('planet-view').getBoundingClientRect();

const x1 = rect1.left + rect1.width / 2 - planetRect.left;
const y1 = rect1.top + rect1.height / 2 - planetRect.top;
const x2 = rect2.left + rect2.width / 2 - planetRect.left;
const y2 = rect2.top + rect2.height / 2 - planetRect.top;

const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

arrow.innerHTML = `<div class="army-arrow-line" style="width: ${length}px; transform: rotate(${angle}deg); background: linear-gradient(to right, #ff0000, #ff0000 70%, transparent); box-shadow: 0 0 10px #ff0000;"><div class="army-arrow-head" style="border-left-color: #ff0000; filter: drop-shadow(0 0 5px #ff0000);"></div></div>`;
arrow.style.left = `${x1}px`;
arrow.style.top = `${y1}px`;

document.getElementById('planet-view').appendChild(arrow);

animateUnitsToTarget(fromTribal, toCity, x1, y1, x2, y2, travelTime, true);

setTimeout(() => arrow.remove(), travelTime);
}

function animateUnitsToTarget(fromEntity, toEntity, x1, y1, x2, y2, duration, isTribalAttack) {
const units = [];

if (isTribalAttack) {
    for (let i = 0; i < fromEntity.units.infantry; i++) units.push({ type: 'infantry', symbol: '⚔' });
    for (let i = 0; i < fromEntity.units.cavalry; i++) units.push({ type: 'cavalry', symbol: '♞' });
    for (let i = 0; i < fromEntity.units.artillery; i++) units.push({ type: 'artillery', symbol: '⚡' });
} else {
    for (let i = 0; i < fromEntity.stationedUnits.infantry; i++) units.push({ type: 'infantry', symbol: '⚔' });
    for (let i = 0; i < fromEntity.stationedUnits.cavalry; i++) units.push({ type: 'cavalry', symbol: '♞' });
    for (let i = 0; i < fromEntity.stationedUnits.artillery; i++) units.push({ type: 'artillery', symbol: '⚡' });
}

units.forEach((unit, index) => {
    const unitEl = document.createElement('div');
    unitEl.className = `traveling-unit unit-icon unit-icon-${unit.type}`;
    unitEl.innerHTML = `
        <div class="unit-icon-inner">
            <div class="unit-icon-outer-ring"></div>
            <div class="unit-icon-middle-layer"></div>
            <div class="unit-icon-core">
                <span class="unit-icon-symbol">${unit.symbol}</span>
            </div>
        </div>
    `;

    const offset = (index - units.length / 2) * 10;
    unitEl.style.left = `${x1 + offset}px`;
    unitEl.style.top = `${y1}px`;

    document.getElementById('planet-view').appendChild(unitEl);

    setTimeout(() => {
        unitEl.style.transition = `all ${duration}ms linear`;
        unitEl.style.left = `${x2 + offset}px`;
        unitEl.style.top = `${y2}px`;
    }, 50);

    setTimeout(() => {
        unitEl.remove();
    }, duration + 100);
});
}

function animateUnitsReturning(fromX, fromY, toCity, survivors, duration) {
const cityEl = document.getElementById(`city-${toCity.id}`);
if (!cityEl) return;

const rect = cityEl.getBoundingClientRect();
const planetRect = document.getElementById('planet-view').getBoundingClientRect();

const x2 = rect.left + rect.width / 2 - planetRect.left;
const y2 = rect.top + rect.height / 2 - planetRect.top;

const units = [];
for (let i = 0; i < survivors.infantry; i++) units.push({ type: 'infantry', symbol: '⚔' });
for (let i = 0; i < survivors.cavalry; i++) units.push({ type: 'cavalry', symbol: '♞' });
for (let i = 0; i < survivors.artillery; i++) units.push({ type: 'artillery', symbol: '⚡' });

units.forEach((unit, index) => {
    const unitEl = document.createElement('div');
    unitEl.className = `traveling-unit traveling-unit-returning unit-icon unit-icon-${unit.type}`;
    unitEl.innerHTML = `
        <div class="unit-icon-inner">
            <div class="unit-icon-outer-ring"></div>
            <div class="unit-icon-middle-layer"></div>
            <div class="unit-icon-core">
                <span class="unit-icon-symbol">${unit.symbol}</span>
            </div>
        </div>
    `;

    const offset = (index - units.length / 2) * 10;
    unitEl.style.left = `${fromX + offset}px`;
    unitEl.style.top = `${fromY}px`;

    document.getElementById('planet-view').appendChild(unitEl);

    setTimeout(() => {
        unitEl.style.transition = `all ${duration}ms ease-out`;
        unitEl.style.left = `${x2 + offset}px`;
        unitEl.style.top = `${y2}px`;
    }, 50);

    setTimeout(() => {
        unitEl.remove();
        updateCityUnitIcons(toCity);
    }, duration + 100);
});
}

function handlePlanetClick(e) {
    if (!game.placingCity && !game.buildingRoad) {
        document.getElementById('placement-radius').classList.remove('active');
        return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (game.placingCity) {
        if (canPlaceCityAt(x, y)) {
            createCity(x, y);
            cancelCityPlacement();
        } else {
            addMessage('Too close to another city!', 'warning');
        }
    } else if (game.buildingRoad) {}
}

function handlePlanetMove(e) {
    if (!game.placingCity) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const preview = document.getElementById('placement-preview');
    const radius = document.getElementById('placement-radius');

    preview.style.left = `${x}%`;
    preview.style.top = `${y}%`;
    preview.classList.add('active');

    radius.style.left = `${x}%`;
    radius.style.top = `${y}%`;

    const mainGame = document.getElementById('main-game');
    const gameRect = mainGame.getBoundingClientRect();
    const avgDimension = (gameRect.width + gameRect.height) / 2;
    const radiusSize = (CITY_FEATURE_RADIUS / 100) * avgDimension * 2 * 10;
    radius.style.width = radius.style.height = `${radiusSize}px`;
    radius.classList.add('active');

    preview.classList.toggle('invalid', !canPlaceCityAt(x, y));

    updateBuildCityButtonText(x, y);
}

function createRoad(city1, city2) {
    const distance = Math.sqrt(Math.pow(city1.x - city2.x, 2) + Math.pow(city1.y - city2.y, 2));
    const distMult = distance > 20 ? 1.5 : 1;

    const roadCost = {
        food: 0,
        metal: Math.floor(100 * distMult * (1 - TechTree.getTechBonus('roadCost'))),
        energy: Math.floor(50 * distMult * (1 - TechTree.getTechBonus('roadCost')))
    };

    if (!hasResources(roadCost)) {
        addMessage(`Road costs ${roadCost.metal}M, ${roadCost.energy}E at this distance!`, 'warning');
        return;
    }

    if (city2.isRebel) {
        addMessage('Cannot build road to a rebel city!', 'warning');
        return;
    }

    const exists = game.roads.some(r => (r.from === city1.id && r.to === city2.id) || (r.from === city2.id && r.to === city1.id));
    if (exists) {
        addMessage('Road already exists!', 'warning');
        return;
    }
    const road = { id: roadIdCounter++, from: city1.id, to: city2.id };
    game.roads.push(road);
    spendResources(roadCost);

    const roadEl = document.createElement('div');
    roadEl.className = 'road';
    roadEl.id = `road-${road.id}`;
    document.getElementById('planet-view').appendChild(roadEl);

    setTimeout(() => {
        updateRoadPosition(roadEl, city1.id, city2.id);
    }, 0);

    addMessage(`Road built: ${city1.name} ↔ ${city2.name}!`, 'success');
}

function startRoadBuilding() {
    if (!game.selectedCity) {
        addMessage('Select a city first!', 'warning');
        return;
    }
    if (game.selectedType === 'tribal') {
        addMessage('Cannot build roads from tribal cities!', 'warning');
        return;
    }
    if (!hasResources({food: 0, metal: 100, energy: 50})) {
        addMessage('Not enough resources!', 'warning');
        return;
    }
    game.buildingRoad = true;
    game.placingCity = false;
    game.roadStartCity = game.selectedCity;
    document.getElementById('build-road-btn').classList.add('active');
    document.getElementById('build-city-btn').classList.remove('active');
    addMessage(`Building road from ${game.selectedCity.name}. Click another city.`, 'info');
}

function generateTribalCities() {
    const numCities = Math.floor(Math.random() * 2) + 2;
    const usedTribalNames = [];

    const clusterCenterX = 8 + Math.random() * 5;
    const clusterCenterY = 20 + Math.random() * 20;

    for (let i = 0; i < numCities; i++) {
        const angle = (i / numCities) * Math.PI * 2;
        const distance = 3 + Math.random() * 4;
        const x = clusterCenterX + Math.cos(angle) * distance;
        const y = clusterCenterY + Math.sin(angle) * distance;

        const availableNames = TRIBAL_NAMES.filter(n => !usedTribalNames.includes(n));
        const name = availableNames.length > 0
            ? availableNames[Math.floor(Math.random() * availableNames.length)]
            : `Tribe ${tribalIdCounter}`;
        usedTribalNames.push(name);

        const tribal = {
            id: tribalIdCounter++,
            name: name,
            x, y, population: 300, isConverted: false,
            units: { infantry: 1, cavalry: 1, artillery: 0 }
        };

        game.tribalCities.push(tribal);
        createTribalCityElement(tribal);
    }
}

    function createTribalCityElement(tribal) {
        const el = document.createElement('div');
        el.className = 'tribal-city';
        el.id = `tribal-${tribal.id}`;
        el.style.left = `${tribal.x}%`;
        el.style.top = `${tribal.y}%`;
        el.style.transform = 'translate(-50%, -50%)';
        el.innerHTML = `<div class="tribal-label">${tribal.name}</div><div class="tribal-city-icon"></div>`;
el.onclick = (e) => {
e.stopPropagation();
if (game.buildingRoad) {
    addMessage('Cannot build roads to tribal cities!', 'warning');
    game.buildingRoad = false;
    game.roadStartCity = null;
    document.getElementById('build-road-btn').classList.remove('active');
    return;
}
selectTribalCity(tribal);
};
        document.getElementById('planet-view').appendChild(el);
setTimeout(() => updateTribalUnitIcons(tribal), 100);
    }

function selectTribalCity(tribal) {
game.selectedCity = tribal;
game.selectedType = 'tribal';

const panel = document.getElementById('info-panel');
const distance = getClosestPlayerCityDistance(tribal);
const closestCity = getClosestPlayerCity(tribal);

if (game.tribalsDefeated) {
    panel.innerHTML = `<h3>${tribal.name}</h3><p style="color: #666;">✓ Tribals Defeated</p><p><strong>Position:</strong> ${tribal.x.toFixed(1)}%</p><p style="font-size: 10px; opacity: 0.7;">This civilization has been conquered.</p>`;
    panel.style.display = 'block';
    return;
}

const statusText = tribal.isConverted
    ? '<p style="color: #00ff00;">✓ Converted</p>'
    : `<p style="color: #ff4400;">Tribal (${game.tribalRelation})</p>`;

let unitsText = '';
if (!tribal.isConverted) {
    const isScouted = isTribalScouted(tribal.id);
    const isWartime = game.tribalRelation === 'war';

    if (!isWartime || isScouted) {
        unitsText = `<p style="font-size: 10px;"><strong>Forces:</strong> ${tribal.units.infantry} Inf, ${tribal.units.cavalry} Cav, ${tribal.units.artillery} Art</p>`;
    } else {
        unitsText = `<p style="font-size: 10px; color: #ff4400;"><strong>Forces:</strong> Unknown (Scout to reveal)</p>`;
    }
}

const cityHasUnits = closestCity && (closestCity.stationedUnits.infantry > 0 || closestCity.stationedUnits.cavalry > 0 || closestCity.stationedUnits.artillery > 0);
const attackBtn = !tribal.isConverted && game.tribalRelation === 'war' && cityHasUnits
? `<button class="action-btn" onclick="attackTribalCity(${tribal.id})">Attack City</button>`
: '';

panel.innerHTML = `<h3>${tribal.name}</h3>${statusText}<p><strong>Position:</strong> ${tribal.x.toFixed(1)}%</p><p><strong>Population:</strong> ${Math.floor(tribal.population)}</p>${unitsText}<p><strong>Distance:</strong> ${distance.toFixed(1)}%</p>${attackBtn}`;
panel.style.display = 'block';
}



    function getClosestPlayerCityDistance(tribal) {
        if (game.cities.length === 0) return 999;
        return Math.min(...game.cities.map(city => Math.sqrt(Math.pow(tribal.x - city.x, 2) + Math.pow(tribal.y - city.y, 2))));
    }

    function getClosestPlayerCity(tribal) {
        if (game.cities.length === 0) return null;
        return game.cities.reduce((closest, city) => {
            const dist = Math.sqrt(Math.pow(tribal.x - city.x, 2) + Math.pow(tribal.y - city.y, 2));
            const closestDist = Math.sqrt(Math.pow(tribal.x - closest.x, 2) + Math.pow(tribal.y - closest.y, 2));
            return dist < closestDist ? city : closest;
        });
    }

function getTotalAttack(city) {
    const infAttack = city.stationedUnits.infantry * UNIT_TYPES.infantry.attack;
    const cavAttack = city.stationedUnits.cavalry * UNIT_TYPES.cavalry.attack;
    const artAttack = city.stationedUnits.artillery * UNIT_TYPES.artillery.attack;

    const infBonus = 1 + TechTree.getTechBonus('infantryAttack');
    const cavBonus = 1 + TechTree.getTechBonus('cavalryAttack');
    const artBonus = 1 + TechTree.getTechBonus('artilleryAttack');

    return (infAttack * infBonus) + (cavAttack * cavBonus) + (artAttack * artBonus);
}

function getTotalDefense(city) {
    return city.stationedUnits.infantry * UNIT_TYPES.infantry.defense +
           city.stationedUnits.cavalry * UNIT_TYPES.cavalry.defense +
           city.stationedUnits.artillery * UNIT_TYPES.artillery.defense;
}

    function showArmyArrow(fromCity, toTribal) {
const attackingCities = game.attackingCities.length > 0 ? game.attackingCities : [fromCity];

attackingCities.forEach(city => {
    const totalUnits = city.stationedUnits.infantry + city.stationedUnits.cavalry + city.stationedUnits.artillery;
    const distance = Math.sqrt(Math.pow(toTribal.x - city.x, 2) + Math.pow(city.y - toTribal.y, 2));
    const travelTime = Math.max(2000, Math.min(5000, distance * 80 + totalUnits * 100));

    const arrow = document.createElement('div');
    arrow.className = 'army-arrow';

    const fromEl = document.getElementById(`city-${city.id}`);
    const toEl = document.getElementById(`tribal-${toTribal.id}`);
    if (!fromEl || !toEl) return;

    const rect1 = fromEl.getBoundingClientRect();
    const rect2 = toEl.getBoundingClientRect();
    const planetRect = document.getElementById('planet-view').getBoundingClientRect();

    const x1 = rect1.left + rect1.width / 2 - planetRect.left;
    const y1 = rect1.top + rect1.height / 2 - planetRect.top;
    const x2 = rect2.left + rect2.width / 2 - planetRect.left;
    const y2 = rect2.top + rect2.height / 2 - planetRect.top;

    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    arrow.innerHTML = `<div class="army-arrow-line" style="width: ${length}px; transform: rotate(${angle}deg);"><div class="army-arrow-head"></div></div>`;
    arrow.style.left = `${x1}px`;
    arrow.style.top = `${y1}px`;

    document.getElementById('planet-view').appendChild(arrow);

    animateUnitsToTarget(city, toTribal, x1, y1, x2, y2, travelTime, false);

    setTimeout(() => arrow.remove(), travelTime);
});
}

    function attackTribalCity(tribalId) {
const tribal = game.tribalCities.find(t => t.id === tribalId);
if (!tribal || tribal.isConverted || game.ddrActive) return;

game.targetTribal = tribal;
game.selectingAttackers = true;
game.attackingCities = [];

addMessage('Select cities to attack from (click cities, then Attack button)', 'info');

const panel = document.getElementById('info-panel');
panel.innerHTML = `
    <h3>Select Attack Force</h3>
    <p><strong>Target:</strong> ${tribal.name}</p>
    <p style="font-size: 10px;">Click cities with units to add to attack</p>
    <div id="selected-attackers" style="margin: 10px 0;"></div>
    <button class="action-btn" onclick="confirmAttack()">Launch Attack</button>
    <button class="action-btn" onclick="cancelAttackSelection()">Cancel</button>
`;
}


function openBattlePlanningScreen(tribal) {
const prediction = calculateBattlePrediction(tribal);
if (!prediction) return;

const panel = document.getElementById('battle-planning');
const closestCity = getClosestPlayerCity(tribal);
const isScouted = isTribalScouted(tribal.id);
const connectedCities = closestCity ? getConnectedCityCount(closestCity) : 0;

panel.innerHTML = `
    <h2>Battle Planning: ${tribal.name}</h2>

    <div class="battle-main-panel">
        <div class="risk-assessment risk-${prediction.risk}">
            <div style="font-size: 20px; margin-bottom: 5px;">${prediction.prediction}</div>
            <div style="font-size: 12px;">Power Ratio: ${prediction.powerRatio.toFixed(2)}x</div>
        </div>

        <div class="battle-info">
            <div class="info-item">
                <div class="info-label">YOUR FORCES</div>
                <div class="info-value">${prediction.playerForces}</div>
            </div>
            <div class="info-item">
                <div class="info-label">ENEMY FORCES</div>
                <div class="info-value">${isScouted ? prediction.tribalForces : '???'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">DISTANCE</div>
                <div class="info-value">${prediction.distance.toFixed(1)}%</div>
            </div>
            <div class="info-item">
                <div class="info-label">MARCH PENALTY</div>
                <div class="info-value">${Math.floor((1 - prediction.distancePenalty) * 100)}%</div>
            </div>
            <div class="info-item">
                <div class="info-label">MORALE</div>
                <div class="info-value">${Math.floor(prediction.moraleMod * 100)}%</div>
            </div>
            <div class="info-item">
                <div class="info-label">SUPPLY LINES</div>
                <div class="info-value">${connectedCities} ${connectedCities > 0 ? '✓' : '✗'}</div>
            </div>
            ${!isScouted ? '<div class="info-item" style="grid-column: 1 / -1; background: rgba(255,68,0,0.2); border: 1px solid #ff4400;"><div style="font-size: 11px;">⚠️ Enemy forces unknown - Send scout for intel</div></div>' : ''}
        </div>

        <h3 style="color: #ffaa00; font-size: 14px; margin-top: 15px;">Formation</h3>
        <div class="formation-selector">
            <div class="formation-option ${game.battleFormation === 'offensive' ? 'selected' : ''}" data-formation="offensive">
                <div class="formation-name">Offensive</div>
                <div class="formation-effect">+20% ATK, -10% DEF</div>
            </div>
            <div class="formation-option ${game.battleFormation === 'balanced' ? 'selected' : ''}" data-formation="balanced">
                <div class="formation-name">Balanced</div>
                <div class="formation-effect">No modifiers</div>
            </div>
            <div class="formation-option ${game.battleFormation === 'defensive' ? 'selected' : ''}" data-formation="defensive">
                <div class="formation-name">Defensive</div>
                <div class="formation-effect">-10% ATK, +20% DEF</div>
            </div>
        </div>

        <div class="retreat-slider">
            <h3 style="color: #ffaa00; font-size: 14px;">Auto-Retreat Threshold</h3>
            <input type="range" id="retreat-slider" min="0" max="75" value="${game.retreatThreshold}" step="25">
            <div style="font-size: 12px; text-align: center;">Retreat at <span id="retreat-value">${game.retreatThreshold}</span>% casualties</div>
        </div>

        <div class="planning-buttons">
<button id="scout-battle-btn" ${isScouted || (game.resources.food + game.resources.metal + game.resources.energy) < 50 ? 'disabled' : ''}>${isScouted ? 'Scouted ✓' : 'Scout (50 res)'}</button><button id="cancel-battle-btn">Cancel</button>
<button id="begin-battle-btn" style="background: #ff4400; border-color: #ff4400;">ATTACK!</button>
</div>
    </div>

    <div class="battle-perks-panel">
        <div class="perk-selection" id="perk-selection-container"></div>
    </div>
`;

updatePerkSelection();

document.getElementById('retreat-slider').addEventListener('input', (e) => {
    game.retreatThreshold = parseInt(e.target.value);
    document.getElementById('retreat-value').textContent = game.retreatThreshold;
});

document.querySelectorAll('.formation-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.formation-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        game.battleFormation = option.getAttribute('data-formation');
        openBattlePlanningScreen(tribal);
    });
});

panel.style.display = 'grid';

document.getElementById('scout-battle-btn').onclick = sendScout;
document.getElementById('cancel-battle-btn').onclick = cancelBattlePlanning;
document.getElementById('begin-battle-btn').onclick = beginBattle;
}


function updatePerkSelection() {
const container = document.getElementById('perk-selection-container');

if (game.commanderLevel < 2) {
    container.innerHTML = '<div style="text-align: center; opacity: 0.7; font-size: 11px;">Unlock perks by winning battles (Level 2+)</div>';
    return;
}

container.innerHTML = '<h3 style="color: #ffaa00; font-size: 14px; margin-bottom: 8px;">Commander Perks (Select up to 2)</h3>';

Object.keys(PERKS).forEach(perkKey => {
    const perk = PERKS[perkKey];
    const isUnlocked = game.commanderLevel >= perk.level;
    const isSelected = game.activePerks.includes(perkKey);
    const canSelect = game.activePerks.length < 2 || isSelected;

    const perkDiv = document.createElement('div');
    perkDiv.className = `perk-option ${isSelected ? 'selected' : ''} ${!isUnlocked || !canSelect ? 'locked' : ''}`;

    if (isUnlocked && canSelect) {
        perkDiv.onclick = () => togglePerk(perkKey);
    }

    perkDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: bold; color: ${isUnlocked ? '#00ff00' : '#666'};">${perk.name} ${isSelected ? '✓' : ''}</div>
                <div style="font-size: 10px; opacity: 0.8;">${perk.description}</div>
            </div>
            <div style="font-size: 10px; opacity: 0.6;">Lvl ${perk.level}</div>
        </div>
    `;

    container.appendChild(perkDiv);
});
}

function togglePerk(perkKey) {
const index = game.activePerks.indexOf(perkKey);

if (index > -1) {
    game.activePerks.splice(index, 1);
} else {
    if (game.activePerks.length < 2) {
        game.activePerks.push(perkKey);
    } else {
        addMessage('Maximum 2 perks active!', 'warning');
        return;
    }
}

updatePerkSelection();
}

function awardCommanderXP(amount) {
game.commanderXP += amount;
const xpNeeded = game.commanderLevel * 100;

if (game.commanderXP >= xpNeeded) {
    game.commanderXP -= xpNeeded;
    game.commanderLevel++;
    addMessage(`⭐ Commander Level ${game.commanderLevel}! New perks unlocked!`, 'success');
    AudioManager.playSFX('sfx-success', 0.8);

    Object.keys(PERKS).forEach(perkKey => {
        if (PERKS[perkKey].level === game.commanderLevel) {
            addMessage(`Unlocked: ${PERKS[perkKey].name}`, 'info');
        }
    });
}
}

function sendScout() {
    if (!game.currentBattle) return;
    if (!hasResources(50)) {
        addMessage('Need 50 resources for scouting!', 'warning');
        return;
    }

    spendResources(50);
    game.scoutedTribalCities.push(game.currentBattle.id);

    addMessage(`Scouts reveal ${game.currentBattle.name} forces!`, 'success');
    AudioManager.playSFX('sfx-success', 0.5);

    updateTribalUnitIcons(game.currentBattle);

    openBattlePlanningScreen(game.currentBattle);
}


function cancelBattlePlanning() {
document.getElementById('battle-planning').style.display = 'none';
game.currentBattle = null;
}


    function startEnhancedDDRBattle(tribal) {
const closestCity = getClosestPlayerCity(tribal);
if (!closestCity) {
    addMessage('No city available to launch attack!', 'warning');
    game.ddrActive = false;
    return;
}

game.ddrActive = true;
game.ddrCombo = 0;
game.ddrBonus = 0;
game.ddrCurrentIndex = 0;
game.battlePhase = 1;

if (game.activePerks.includes('veteranTroops')) {
    game.ddrCombo = 2;
    game.ddrBonus = 20;
}

AudioManager.playBattleMusic();

const totalUnits = closestCity.stationedUnits.infantry + closestCity.stationedUnits.cavalry + closestCity.stationedUnits.artillery;
const sequenceLength = Math.min(15, 8 + Math.floor(totalUnits / 3));

const arrows = ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'];
game.ddrSequence = [];
for (let i = 0; i < sequenceLength; i++) {
    game.ddrSequence.push(arrows[Math.floor(Math.random() * arrows.length)]);
}

document.getElementById('ddr-overlay').classList.add('active');
document.getElementById('ddr-combo').textContent = `Combo: ${game.ddrCombo} | Bonus: +${game.ddrBonus}%`;

const weatherIndicator = document.getElementById('weather-indicator');
weatherIndicator.textContent = game.weatherEvent.name + ' - ' + game.weatherEvent.description;
weatherIndicator.style.display = 'block';

setTimeout(() => {
    weatherIndicator.style.display = 'none';
}, 3000);

showPhaseIndicator('Phase 1: Artillery Barrage');

let timeLeft = 15;
const timerEl = document.getElementById('ddr-timer');

const timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    timerEl.textContent = `Time remaining: ${timeLeft.toFixed(1)}s`;

    if (game.battlePhase === 1 && game.ddrCurrentIndex >= 5) {
        game.battlePhase = 2;
        showPhaseIndicator('Phase 2: Cavalry Charge');
    } else if (game.battlePhase === 2 && game.ddrCurrentIndex >= 10) {
        game.battlePhase = 3;
        showPhaseIndicator('Phase 3: Infantry Clash');
    }

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endEnhancedDDRBattle();
    }
}, 100);

game.ddrTimeout = timerInterval;
nextEnhancedDDRArrow();
}

function showPhaseIndicator(text) {
const indicator = document.getElementById('phase-indicator');
indicator.textContent = text;
indicator.style.display = 'block';

setTimeout(() => {
    indicator.style.display = 'none';
}, 2000);
}

function nextEnhancedDDRArrow() {
if (game.ddrCurrentIndex >= game.ddrSequence.length) return;

document.querySelectorAll('.ddr-arrow').forEach(a => {
    a.classList.remove('active', 'hit', 'miss');
});

const currentKey = game.ddrSequence[game.ddrCurrentIndex];
const arrowEl = document.querySelector(`.ddr-arrow[data-key="${currentKey}"]`);

if (arrowEl) {
    arrowEl.classList.add('active');

    let arrowSpeed = 1000;

    if (game.battleMorale > 75) {
        arrowSpeed = 1200;
    } else if (game.battleMorale > 50) {
        arrowSpeed = 1000;
    } else if (game.battleMorale > 25) {
        arrowSpeed = 800;
    } else {
        arrowSpeed = 600;
    }

    if (game.activePerks.includes('swiftStrike') && game.ddrCurrentIndex < 5) {
        arrowSpeed *= 1.3;
    }

    if (game.weatherEvent.effect === 'slow') {
        arrowSpeed *= 1.2;
    }

    if (game.battlePhase === 2) {
        arrowSpeed *= 0.9;
    }

    if (game.weatherEvent.effect === 'vanish' && Math.random() < 0.3) {
        setTimeout(() => {
            if (arrowEl.classList.contains('active')) {
                arrowEl.style.opacity = '0';
                setTimeout(() => {
                    arrowEl.style.opacity = '1';
                }, 300);
            }
        }, arrowSpeed * 0.3);
    }

    if (game.weatherEvent.effect === 'late') {
        setTimeout(() => {
            arrowEl.classList.add('active');
        }, 200);
        arrowEl.classList.remove('active');
    }
}
}


    function handleDDRInput(key) {
if (!game.ddrActive) return;

const expectedKey = game.ddrSequence[game.ddrCurrentIndex];
const arrowEl = document.querySelector(`.ddr-arrow[data-key="${expectedKey}"]`);

if (key === expectedKey) {
    if (arrowEl) {
        arrowEl.classList.remove('active');
        arrowEl.classList.add('hit');
    }
    game.ddrCombo++;
    game.ddrBonus = Math.min(100, game.ddrCombo * 10);

    if (game.activePerks.includes('inspiration') && game.battleMorale > 75) {
        game.ddrBonus += 15;
    }

    document.getElementById('ddr-combo').textContent = `Combo: ${game.ddrCombo} | Bonus: +${game.ddrBonus}%`;
    game.ddrCurrentIndex++;

    if (game.ddrCurrentIndex >= game.ddrSequence.length) {
        setTimeout(() => endEnhancedDDRBattle(), 500);
    } else {
        setTimeout(() => nextEnhancedDDRArrow(), 200);
    }
} else {
    const hasRelentless = game.activePerks.includes('relentless');
    const isFirstMiss = game.ddrCombo > 0;

    if (hasRelentless && isFirstMiss && !game.relentlessUsed) {
        game.relentlessUsed = true;
        document.getElementById('ddr-combo').textContent = `Combo: ${game.ddrCombo} | Bonus: +${game.ddrBonus}% - RELENTLESS!`;
        if (arrowEl) {
            arrowEl.classList.add('miss');
            setTimeout(() => {
                arrowEl.classList.remove('miss');
                arrowEl.classList.add('active');
            }, 300);
        }
    } else {
        game.ddrCombo = 0;
        game.ddrBonus = 0;
        game.battleMorale = Math.max(0, game.battleMorale - 10);
        document.getElementById('ddr-combo').textContent = `Combo: 0 | Bonus: +0% - MISS! (Morale: ${game.battleMorale})`;
        if (arrowEl) {
            arrowEl.classList.remove('active');
            arrowEl.classList.add('miss');
            setTimeout(() => {
                arrowEl.classList.remove('miss');
                arrowEl.classList.add('active');
            }, 300);
        }
    }
}
}

function callReinforcements() {
    if (!canCallReinforcements()) {
        addMessage('No reinforcements available!', 'warning');
        return;
    }

    const closestCity = getClosestPlayerCity(game.currentBattle);

    spendResources(300);
    closestCity.stationedUnits.infantry += 1;
    closestCity.stationedUnits.cavalry += 1;

    addMessage('Reinforcements arriving!', 'success');
    AudioManager.playSFX('sfx-success', 0.6);

    game.ddrSequence.push('ArrowUp', 'ArrowRight');
}

function updateZoom(delta) {
    const oldZoom = mapZoom;
    mapZoom = Math.max(0.3, Math.min(2, mapZoom + delta));

    const planetView = document.getElementById('planet-view');
    const mainGame = document.getElementById('main-game');
    const rect = mainGame.getBoundingClientRect();

    const mouseX = rect.width / 2;
    const mouseY = rect.height / 2;

    const worldX = (mouseX - mapPanX) / oldZoom;
    const worldY = (mouseY - mapPanY) / oldZoom;

    mapPanX = mouseX - worldX * mapZoom;
    mapPanY = mouseY - worldY * mapZoom;

    applyMapTransform();
    updateMinimap();
}

function applyMapTransform() {
    const planetView = document.getElementById('planet-view');
    const mainGame = document.getElementById('main-game');
    const rect = mainGame.getBoundingClientRect();

    const planetWidth = rect.width * 10;
    const planetHeight = rect.height * 10;

    const scaledWidth = planetWidth * mapZoom;
    const scaledHeight = planetHeight * mapZoom;

    const minPanX = rect.width - scaledWidth;
    const minPanY = rect.height - scaledHeight;

    mapPanX = Math.max(minPanX, Math.min(0, mapPanX));
    mapPanY = Math.max(minPanY, Math.min(0, mapPanY));

    planetView.style.transition = 'none';
    planetView.style.transform = `translate(${mapPanX}px, ${mapPanY}px) scale(${mapZoom})`;

    game.roads.forEach(road => {
        const roadEl = document.getElementById(`road-${road.id}`);
        if (roadEl) {
            updateRoadPosition(roadEl, road.from, road.to);
        }
    });

    game.tribalRoads.forEach(road => {
        const roadEl = document.getElementById(`tribal-road-${road.from}-${road.to}`);
        if (roadEl) {
            updateTribalRoadPosition(roadEl, road.from, road.to);
        }
    });
}

function updateMinimap() {
    const minimap = document.getElementById('minimap');
    minimap.innerHTML = '<div class="minimap-viewport"></div>';

    game.cities.forEach(city => {
        const dot = document.createElement('div');
        dot.className = 'minimap-city';
        dot.style.left = `${city.x}%`;
        dot.style.top = `${city.y}%`;
        minimap.appendChild(dot);
    });

    game.tribalCities.forEach(tribal => {
        if (!tribal.isConverted) {
            const dot = document.createElement('div');
            dot.className = 'minimap-tribal';
            dot.style.left = `${tribal.x}%`;
            dot.style.top = `${tribal.y}%`;
            minimap.appendChild(dot);
        }
    });

    const mainGame = document.getElementById('main-game');
    const rect = mainGame.getBoundingClientRect();
    const viewport = minimap.querySelector('.minimap-viewport');

    const planetWidth = rect.width * 10;
    const planetHeight = rect.height * 10;

    const scaledWidth = planetWidth * mapZoom;
    const scaledHeight = planetHeight * mapZoom;

    const viewWidth = Math.min(100, (rect.width / scaledWidth) * 100);
    const viewHeight = Math.min(100, (rect.height / scaledHeight) * 100);

    const viewX = Math.max(0, Math.min(100 - viewWidth, (-mapPanX / scaledWidth) * 100));
    const viewY = Math.max(0, Math.min(100 - viewHeight, (-mapPanY / scaledHeight) * 100));

    viewport.style.left = `${viewX}%`;
    viewport.style.top = `${viewY}%`;
    viewport.style.width = `${viewWidth}%`;
    viewport.style.height = `${viewHeight}%`;
}

function endEnhancedDDRBattle() {
    if (game.ddrTimeout) {
        clearInterval(game.ddrTimeout);
        game.ddrTimeout = null;
    }

    AudioManager.playBgMusic();

    document.getElementById('ddr-overlay').classList.remove('active');
    document.getElementById('weather-indicator').style.display = 'none';
    document.getElementById('phase-indicator').style.display = 'none';

    if (!game.currentBattle) {
        game.ddrActive = false;
        return;
    }

    const tribal = game.currentBattle;
    const formation = FORMATIONS[game.battleFormation];
    const prediction = calculateBattlePrediction(tribal);
    const closestCity = getClosestPlayerCity(tribal);

    let playerAttack = (closestCity.stationedUnits.infantry * UNIT_TYPES.infantry.attack +
                   closestCity.stationedUnits.cavalry * UNIT_TYPES.cavalry.attack +
                   closestCity.stationedUnits.artillery * UNIT_TYPES.artillery.attack);

    playerAttack *= formation.atkMod;
    playerAttack *= (1 + TechTree.getTechBonus('attackBonus'));
    playerAttack *= (1 + game.ddrBonus / 100);
    playerAttack *= prediction.distancePenalty;
    playerAttack *= prediction.moraleMod;

    if (game.activePerks.includes('inspiration') && game.battleMorale > 75) {
        playerAttack *= 1.15;
    }

    let playerDefense = (closestCity.stationedUnits.infantry * UNIT_TYPES.infantry.defense +
                        closestCity.stationedUnits.cavalry * UNIT_TYPES.cavalry.defense +
                        closestCity.stationedUnits.artillery * UNIT_TYPES.artillery.defense);

    playerDefense *= formation.defMod;
    playerDefense *= (1 + TechTree.getTechBonus('defenseBonus'));

    if (game.activePerks.includes('defensiveGenius')) {
        playerDefense *= 1.25;
    }

    const tribalAttack = tribal.units.infantry * 5 + tribal.units.cavalry * 12 + tribal.units.artillery * 20;
    const tribalDefense = tribal.units.infantry * 3 + tribal.units.cavalry * 5 + tribal.units.artillery * 2;

    const damageToTribal = Math.max(0, playerAttack - tribalDefense * 0.3);
    const damageToPlayer = Math.max(0, tribalAttack - playerDefense * 0.3);

    const tribalCasualties = Math.floor(damageToTribal / 15);
    let tribalInfLost = 0, tribalCavLost = 0, tribalArtLost = 0;
    let remainingTribalCasualties = tribalCasualties;

    if (tribal.units.artillery > 0 && remainingTribalCasualties > 0) {
        tribalArtLost = Math.min(tribal.units.artillery, Math.ceil(remainingTribalCasualties * 0.3));
        tribal.units.artillery -= tribalArtLost;
        remainingTribalCasualties -= tribalArtLost;
    }
    if (tribal.units.cavalry > 0 && remainingTribalCasualties > 0) {
        tribalCavLost = Math.min(tribal.units.cavalry, Math.ceil(remainingTribalCasualties * 0.4));
        tribal.units.cavalry -= tribalCavLost;
        remainingTribalCasualties -= tribalCavLost;
    }
    if (tribal.units.infantry > 0 && remainingTribalCasualties > 0) {
        tribalInfLost = Math.min(tribal.units.infantry, remainingTribalCasualties);
        tribal.units.infantry -= tribalInfLost;
    }

    const playerCasualties = Math.floor(damageToPlayer / 20);
    let playerInfLost = 0, playerCavLost = 0, playerArtLost = 0;
    let remainingPlayerCasualties = playerCasualties;

    if (closestCity.stationedUnits.artillery > 0 && remainingPlayerCasualties > 0) {
    playerArtLost = Math.min(closestCity.stationedUnits.artillery, Math.ceil(remainingPlayerCasualties * 0.3));
    closestCity.stationedUnits.artillery -= playerArtLost;
    remainingPlayerCasualties -= playerArtLost;
    }
    if (closestCity.stationedUnits.cavalry > 0 && remainingPlayerCasualties > 0) {
    playerCavLost = Math.min(closestCity.stationedUnits.cavalry, Math.ceil(remainingPlayerCasualties * 0.4));
    closestCity.stationedUnits.cavalry -= playerCavLost;
    remainingPlayerCasualties -= playerCavLost;
    }
    if (closestCity.stationedUnits.infantry > 0 && remainingPlayerCasualties > 0) {
    playerInfLost = Math.min(closestCity.stationedUnits.infantry, remainingPlayerCasualties);
    closestCity.stationedUnits.infantry -= playerInfLost;
    }

    const totalPlayerLosses = playerInfLost + playerCavLost + playerArtLost;
    const totalPlayerForces = closestCity.stationedUnits.infantry + closestCity.stationedUnits.cavalry + closestCity.stationedUnits.artillery + totalPlayerLosses;
    const casualtyPercent = (totalPlayerLosses / totalPlayerForces) * 100;

    const didRetreat = game.retreatThreshold > 0 && casualtyPercent >= game.retreatThreshold;

    if (didRetreat) {
        const savedInf = Math.floor(playerInfLost * 0.5);
        const savedCav = Math.floor(playerCavLost * 0.5);
        const savedArt = Math.floor(playerArtLost * 0.5);

        closestCity.stationedUnits.infantry += savedInf;
        closestCity.stationedUnits.cavalry += savedCav;
        closestCity.stationedUnits.artillery += savedArt;

        AudioManager.playSFX('sfx-alert', 0.7);
        addMessage(`TACTICAL RETREAT at ${casualtyPercent.toFixed(0)}% casualties!`, 'warning');
        addMessage(`Saved: ${savedInf} Inf, ${savedCav} Cav, ${savedArt} Art`, 'info');
        addMessage(`Lost: ${playerInfLost - savedInf} Inf, ${playerCavLost - savedCav} Cav, ${playerArtLost - savedArt} Art`, 'danger');

        tribal.population -= damageToTribal * 0.5;
        addMessage(`Enemy casualties: ${tribalInfLost} Inf, ${tribalCavLost} Cav, ${tribalArtLost} Art`, 'warning');

        awardCommanderXP(10);

        game.ddrActive = false;
        game.currentBattle = null;
        game.relentlessUsed = false;
        return;
    }

    tribal.population -= damageToTribal;

    if (tribal.population <= 0) {
        AudioManager.playSFX('sfx-explosion', 0.7);
        addMessage(`${tribal.name} conquered! (DDR Bonus: +${game.ddrBonus}%)`, 'success');
        addMessage(`Formation: ${game.battleFormation.toUpperCase()} | Morale: ${game.battleMorale}`, 'info');
        addMessage(`Enemy losses: ${tribalInfLost} Inf, ${tribalCavLost} Cav, ${tribalArtLost} Art`, 'success');
        addMessage(`Your losses: ${playerInfLost} Inf, ${playerCavLost} Cav, ${playerArtLost} Art`, 'warning');

        let xpGained = 50;
        if (prediction.risk === 'hard') xpGained = 75;
        if (prediction.risk === 'suicide') xpGained = 100;
        if (game.ddrBonus >= 80) xpGained += 25;

        awardCommanderXP(xpGained);
        addMessage(`+${xpGained} Commander XP (${game.commanderXP}/${game.commanderLevel * 100})`, 'info');

        convertTribalCity(tribal);
    } else {
        addMessage(`Battle at ${tribal.name}! (DDR Bonus: +${game.ddrBonus}%)`, 'warning');
        addMessage(`Formation: ${game.battleFormation.toUpperCase()} | Morale: ${game.battleMorale}`, 'info');
        addMessage(`Enemy losses: ${tribalInfLost} Inf, ${tribalCavLost} Cav, ${tribalArtLost} Art (${Math.floor(tribal.population)} pop remains)`, 'warning');
        addMessage(`Your losses: ${playerInfLost} Inf, ${playerCavLost} Cav, ${playerArtLost} Art`, 'warning');

        if (tribal.units.infantry === 0 && tribal.units.cavalry === 0 && tribal.units.artillery === 0) {
            addMessage(` ${tribal.name} has NO remaining military units!`, 'success');
        }

        awardCommanderXP(25);
    }

    game.ddrActive = false;
    game.currentBattle = null;
    game.relentlessUsed = false;

    const tribalEl = document.getElementById(`tribal-${tribal.id}`);
    if (tribalEl) {
    const rect = tribalEl.getBoundingClientRect();
    const planetRect = document.getElementById('planet-view').getBoundingClientRect();
    const battleX = rect.left + rect.width / 2 - planetRect.left;
    const battleY = rect.top + rect.height / 2 - planetRect.top;

    const attackingCities = game.attackingCities.length > 0 ? game.attackingCities : [closestCity];
    attackingCities.forEach(city => {
        const distance = Math.sqrt(Math.pow(tribal.x - city.x, 2) + Math.pow(city.y - city.y, 2));
        const returnTime = Math.max(1500, Math.min(4000, distance * 60));

        const survivors = {
            infantry: city.stationedUnits.infantry,
            cavalry: city.stationedUnits.cavalry,
            artillery: city.stationedUnits.artillery
        };

        if (survivors.infantry > 0 || survivors.cavalry > 0 || survivors.artillery > 0) {
            animateUnitsReturning(battleX, battleY, city, survivors, returnTime);
        }
    });
    }
}

function convertTribalCity(tribal) {
    tribal.isConverted = true;

    tribal.units.infantry = 0;
    tribal.units.cavalry = 0;
    tribal.units.artillery = 0;

    game.tribalRoads = game.tribalRoads.filter(road => {
        if (road.from === tribal.id || road.to === tribal.id) {
            const roadEl = document.getElementById(`tribal-road-${road.from}-${road.to}`);
            if (roadEl) roadEl.remove();
            return false;
        }
        return true;
    });

    const city = {
        id: cityIdCounter++,
        name: tribal.name + ' (Claimed)',
        position: tribal.x, x: tribal.x, y: tribal.y,
        population: Math.max(100, Math.floor(tribal.population * 0.6)),
        maxPopulation: 750 + TechTree.getTechBonus('maxPopulation'),
        warned: false,
        zoneType: getZoneType(tribal.x),
        isRebel: true, isConverted: true, upgradeLevel: 0,
        happiness: 20, conquestRebellionTimer: 300,
        stationedUnits: { infantry: 1, cavalry: 0, artillery: 0 },
        tradeBoost: 0,
        foodStockpile: 30,
        foodConsumptionRate: 0,
        autoFeed: true
    };

            game.cities.push(city);

            const cityEl = document.createElement('div');
            cityEl.className = 'city city-hot city-rebel';
            cityEl.id = `city-${city.id}`;
            cityEl.style.left = `${city.x}%`;
            cityEl.style.top = `${city.y}%`;
            cityEl.style.transform = 'translate(-50%, -50%)';
            cityEl.innerHTML = `<div class="city-label">${city.name}</div><div class="city-icon"></div><div class="population-bar"><div class="population-fill" style="width: ${(city.population/city.maxPopulation)*100}%"></div></div>`;
            cityEl.onclick = (e) => { e.stopPropagation(); selectCity(city); };
    generateCityBuildings(cityEl, city);

            document.getElementById('planet-view').appendChild(cityEl);

            const tribalEl = document.getElementById(`tribal-${tribal.id}`);
    if (tribalEl) {
    tribalEl.querySelectorAll('.unit-icon').forEach(icon => icon.remove());
    tribalEl.className = 'tribal-city tribal-city-converted';
    }

            game.tribalReputation = Math.max(0, game.tribalReputation - 20);
            updateCityDisplay(city);

    checkTribalDefeat();
}

function calculateFoodNeeds(city) {
    const baseFoodPerPop = 0.00005;
    const inZone = isCityInHabitableZone(city);

    let consumption = city.population * baseFoodPerPop;

    if (!inZone) {
        const dist = getDistanceFromZone(city);
        const harshnessMult = 1 + (Math.min(dist, 30) / 30);
        consumption *= harshnessMult;
    }

    return consumption || 0;
}

function checkTribalDefeat() {
const activeTribalCities = game.tribalCities.filter(t => !t.isConverted);

if (activeTribalCities.length === 0 && !game.tribalsDefeated) {
    game.tribalsDefeated = true;
    game.tribalRelation = 'defeated';

    AudioManager.playBgMusic();

    addMessage('TRIBAL CIVILIZATION DEFEATED! All cities conquered!', 'success');
    addMessage('Tribes can no longer expand or threaten your cities.', 'info');
}
}

function tribalExpansion() {
    if (game.tribalsDefeated) return;

    game.tribalRoadTimer++;
    game.tribalCityTimer++;

    if (game.tribalRoadTimer >= TRIBAL_ROAD_INTERVAL) {
        game.tribalRoadTimer = 0;
        tribalBuildRoad();
    }

    if (game.tribalCityTimer >= TRIBAL_CITY_INTERVAL_MIN + Math.random() * (TRIBAL_CITY_INTERVAL_MAX - TRIBAL_CITY_INTERVAL_MIN)) {
        game.tribalCityTimer = 0;
        tribalBuildCity();
    }
    }

function tribalBuildRoad() {
            const activeTribals = game.tribalCities.filter(t => !t.isConverted);
            if (activeTribals.length < 2) return;

            const t1 = activeTribals[Math.floor(Math.random() * activeTribals.length)];
            const t2 = activeTribals[Math.floor(Math.random() * activeTribals.length)];

            if (t1.id === t2.id) return;

            const exists = game.tribalRoads.some(r =>
                (r.from === t1.id && r.to === t2.id) || (r.from === t2.id && r.to === t1.id)
            );

            if (!exists && Math.sqrt(Math.pow(t1.x - t2.x, 2) + Math.pow(t1.y - t2.y, 2)) < 25) {
                game.tribalRoads.push({ from: t1.id, to: t2.id });
                createTribalRoad(t1, t2);
                addMessage('Tribes built a road connecting their cities!', 'warning');
            }
        }

function tribalBuildCity() {
    const activeTribalCount = game.tribalCities.filter(t => !t.isConverted).length;
    if (activeTribalCount >= 10) {
        game.tribalCityTimer = Math.random() * 500 + TRIBAL_CITY_INTERVAL_MIN;
        return;
    }

    const activeTribals = game.tribalCities.filter(t => !t.isConverted);
    if (activeTribals.length === 0) return;

    const nearTribal = activeTribals[Math.floor(Math.random() * activeTribals.length)];

    let x, y, attempts = 0;
    do {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 8;
        x = nearTribal.x + Math.cos(angle) * distance;
        y = nearTribal.y + Math.sin(angle) * distance;
        attempts++;

        if (attempts > 50) {
            game.tribalCityTimer = Math.random() * 500 + TRIBAL_CITY_INTERVAL_MIN;
            return;
        }
    } while (x < 3 || x > TRIBAL_MAX_EXPANSION || y < 10 || y > 90);

    const usedNames = game.tribalCities.map(t => t.name);
    const availableNames = TRIBAL_NAMES.filter(n => !usedNames.includes(n));
    const name = availableNames.length > 0
        ? availableNames[Math.floor(Math.random() * availableNames.length)]
        : `Tribe ${tribalIdCounter}`;

    const tribal = {
        id: tribalIdCounter++,
        name: name,
        x, y, population: 250, isConverted: false,
        units: { infantry: 0, cavalry: 2, artillery: 1 }
    };

    game.tribalCities.push(tribal);
    createTribalCityElement(tribal);
    addMessage('Tribes founded a new city!', 'danger');
}

function createTribalRoad(t1, t2) {
    const roadEl = document.createElement('div');
    roadEl.className = 'tribal-road';
    roadEl.id = `tribal-road-${t1.id}-${t2.id}`;

    updateTribalRoadPosition(roadEl, t1.id, t2.id);
    document.getElementById('planet-view').appendChild(roadEl);
}

function updateTribalRoadPosition(roadEl, t1Id, t2Id) {
    const t1 = game.tribalCities.find(t => t.id === t1Id);
    const t2 = game.tribalCities.find(t => t.id === t2Id);
    if (!t1 || !t2) return;

    const planetView = document.getElementById('planet-view');
    const planetWidth = planetView.offsetWidth;
    const tribalOffset = (17.5 / planetWidth) * 100;

    const x1 = t1.x + tribalOffset;
    const y1 = t1.y + tribalOffset;
    const x2 = t2.x + tribalOffset;
    const y2 = t2.y + tribalOffset;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    roadEl.style.left = `${x1}%`;
    roadEl.style.top = `${y1}%`;
    roadEl.style.width = `${length}%`;
    roadEl.style.transform = `rotate(${angle}deg)`;
}

function updateAllTribalRoads() {
    game.tribalRoads.forEach(road => {
        const roadEl = document.getElementById(`tribal-road-${road.from}-${road.to}`);
        if (roadEl) {
            updateTribalRoadPosition(roadEl, road.from, road.to);
        }
    });
}

function updateZoom(delta) {
    const oldZoom = mapZoom;
    mapZoom = Math.max(0.3, Math.min(2, mapZoom + delta));

    const planetView = document.getElementById('planet-view');
    const mainGame = document.getElementById('main-game');
    const rect = mainGame.getBoundingClientRect();

    const mouseX = rect.width / 2;
    const mouseY = rect.height / 2;

    const worldX = (mouseX - mapPanX) / oldZoom;
    const worldY = (mouseY - mapPanY) / oldZoom;

    mapPanX = mouseX - worldX * mapZoom;
    mapPanY = mouseY - worldY * mapZoom;

    applyMapTransform();
    updateAllTribalRoads();
    updateMinimap();
}

function recruitUnit(type) {
if (!game.selectedCity || game.selectedType !== 'city') {
addMessage('Select a city first to recruit units!', 'warning');
return;
}

const city = game.selectedCity;
if (city.isRebel) {
addMessage('Cannot recruit in rebel cities!', 'warning');
return;
}

const totalUnitsInCity = city.stationedUnits.infantry + city.stationedUnits.cavalry + city.stationedUnits.artillery;
if (totalUnitsInCity >= 8) {
addMessage(`${city.name} is at max capacity (8 units)!`, 'warning');
return;
}
const unit = UNIT_TYPES[type];
const basePop = type === 'infantry' ? 50 : (type === 'cavalry' ? 100 : 10);
const popCost = Math.floor(basePop * (1 - TechTree.getTechBonus('recruitmentCost')));

const specMod = CITY_SPECIALIZATIONS[city.specialization].recruitCostMod;
const finalCost = {
food: Math.floor(unit.cost.food * specMod),
metal: Math.floor(unit.cost.metal * specMod),
energy: Math.floor(unit.cost.energy * specMod)
};

if (!hasResources(finalCost)) {
addMessage(`Not enough resources for ${unit.name}!`, 'warning');
return;
}


if (city.population < popCost + 10) {
addMessage(`${city.name} needs ${popCost} population to recruit!`, 'warning');
return;
}

const totalInfantry = game.cities.reduce((sum, c) => sum + c.stationedUnits.infantry, 0);
const totalCavalry = game.cities.reduce((sum, c) => sum + c.stationedUnits.cavalry, 0);
const totalArtillery = game.cities.reduce((sum, c) => sum + c.stationedUnits.artillery, 0);

if ((type === 'infantry' && totalInfantry === 11) ||
(type === 'cavalry' && totalCavalry === 11) ||
(type === 'artillery' && totalArtillery === 11)) {
if (!game.tribalsDefeated && game.tribalRelation !== 'war') {
game.tribalReputation = Math.max(0, game.tribalReputation - 10);
addMessage(`Tribes alarmed by your ${unit.name} buildup! (-10 rep)`, 'warning');
AudioManager.playSFX('sfx-alert', 0.5);
}
}


spendResources(finalCost);
city.population -= popCost;
city.stationedUnits[type]++;

addMessage(`Recruited ${unit.name} in ${city.name}!`, 'success');
updateCityDisplay(city);
updateCityUnitIcons(city);
selectCity(city);
}

function provideCharity(cost, happiness) {
if (!hasResources(cost)) {
addMessage('Not enough resources for charity!', 'warning');
return;
}
spendResources(cost);
game.cities.forEach(city => {
if (!city.isRebel) {
    city.happiness = Math.min(100, city.happiness + happiness);
}
});
addMessage(`Provided aid! All cities gained +${happiness} happiness.`, 'success');
}

function tribalTrade() {
    if (game.resources.food < 80 || game.tribalTradeCooldown > 0 || game.tribalRelation === 'war') return;

    game.resources.food -= 80;
    game.resources.metal += 80;

    game.tribalReputation = Math.min(100, game.tribalReputation + 10);
    game.tribalTradeCooldown = 1000;

    addMessage('Trade agreement signed! Converted 80 food to 80 metal!', 'success');
    AudioManager.playSFX('sfx-success', 0.6);
}

function buildEmbassy() {
    if (!hasResources({ food: 200, metal: 200, energy: 100 }) || game.hasEmbassy || game.tribalRelation === 'war') return;
    spendResources({ food: 200, metal: 200, energy: 100 });
        game.hasEmbassy = true;
        game.tribalReputation = Math.min(100, game.tribalReputation + 20);
        addMessage('Embassy established!', 'success');
    }

function denounceTribes() {
if (game.tribalRelation === 'war') return;
if (game.peaceTreatyCooldown > 0) {
addMessage('Cannot denounce during peace treaty!', 'warning');
return;
}
game.tribalReputation = Math.max(0, game.tribalReputation - 30);
addMessage('Denounced tribes! Relations worsened.', 'warning');
}

function declareWar() {
if (game.tribalRelation === 'war') return;
if (game.peaceTreatyCooldown > 0) {
const yearsLeft = Math.ceil(game.peaceTreatyCooldown / 100);
addMessage(`Peace treaty in effect for ${yearsLeft} more years!`, 'warning');
return;
}
game.tribalRelation = 'war';
game.tribalReputation = 0;

AudioManager.playBattleMusic();

game.cities.forEach(city => {
if (!city.isRebel) {
    city.happiness = Math.max(0, city.happiness - 25);
    updateCityDisplay(city);
}
});

addMessage('WAR DECLARED! Tribes will fight back!', 'danger');
addMessage('All cities lost 25 happiness due to war declaration!', 'warning');
AudioManager.playSFX('sfx-alert', 0.7);
}

function updateTribalRelation() {
    const rep = game.tribalReputation;
    let newRelation = 'neutral';

    if (rep <= 20) newRelation = 'war';
    else if (rep <= 40) newRelation = 'hostile';
    else if (rep <= 60) newRelation = 'neutral';
    else if (rep <= 80) newRelation = 'friendly';
    else newRelation = 'allied';

    if (newRelation !== game.tribalRelation && game.tribalRelation !== 'war') {
        game.tribalRelation = newRelation;
        addMessage(`Tribal relations: ${newRelation.toUpperCase()}`, 'info');
    }
}

function setLaw(lawKey) {
    game.activeLaw = lawKey;
    addMessage(`Law: ${LAWS[lawKey].name}`, 'info');
    document.getElementById('current-law-name').textContent = LAWS[lawKey].name;
    document.querySelectorAll('.law-option').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-law') === lawKey);
    });
}

function toggleSpaceportPanel() {
    const panel = document.getElementById('spaceport-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    updateSpaceportPanel();
}

function updateSpaceportPanel() {
    const totalPop = game.cities.reduce((sum, c) => sum + Math.floor(c.population), 0);
    const totalRes = game.resources.food + game.resources.metal + game.resources.energy;

    document.getElementById('sp-pop-current').textContent = totalPop;
    document.getElementById('sp-res-current').textContent = Math.floor(totalRes);

    const progressBar = document.getElementById('spaceport-progress-bar');
    progressBar.style.width = `${game.spaceportProgress}%`;
    progressBar.textContent = `${Math.floor(game.spaceportProgress)}%`;

    const startBtn = document.getElementById('start-spaceport-btn');
    if (game.spaceportBuilding) {
        const yearsLeft = Math.ceil(10 - (game.spaceportProgress / 10));
        startBtn.textContent = `Building... ${yearsLeft} years left`;
        startBtn.disabled = true;
    } else if (totalPop >= 5000 && game.resources.food >= 4000 && game.resources.metal >= 4000 && game.resources.energy >= 4000) {
        startBtn.textContent = 'Start Construction';
        startBtn.disabled = false;
    } else {
        startBtn.textContent = 'Requirements Not Met';
        startBtn.disabled = true;
    }
}

function startSpaceportConstruction() {
    const totalPop = game.cities.reduce((sum, c) => sum + c.population, 0);
    if (totalPop < 5000 || game.resources.food < 4000 || game.resources.metal < 4000 || game.resources.energy < 4000) {
        addMessage('Requirements not met!', 'warning');
        return;
    }

    game.resources.food -= 4000;
    game.resources.metal -= 4000;
    game.resources.energy -= 4000;

    game.spaceportBuilding = true;
    game.spaceportYearStarted = game.year;
    addMessage('Spaceport construction begun! Will take 10 years.', 'success');
    updateSpaceportPanel();
}

function updateUI() {
    const totalPop = game.cities.reduce((sum, c) => sum + Math.floor(c.population), 0);

    document.getElementById('year').textContent = Math.floor(game.year);
    document.getElementById('food-display').textContent = Math.floor(game.resources.food);
    document.getElementById('metal-display').textContent = Math.floor(game.resources.metal);
    document.getElementById('energy-display').textContent = Math.floor(game.resources.energy);
    document.getElementById('total-pop').textContent = totalPop;
    document.getElementById('research-display').textContent = Math.floor(game.researchPoints);


    const totalInfantry = game.cities.reduce((sum, c) => sum + c.stationedUnits.infantry, 0);
    const totalCavalry = game.cities.reduce((sum, c) => sum + c.stationedUnits.cavalry, 0);
    const totalArtillery = game.cities.reduce((sum, c) => sum + c.stationedUnits.artillery, 0);
    const totalRes = game.resources.food + game.resources.metal + game.resources.energy;

    document.getElementById('infantry-display').textContent = totalInfantry;
    document.getElementById('cavalry-display').textContent = totalCavalry;
    document.getElementById('artillery-display').textContent = totalArtillery;


    document.getElementById('tribal-rep').textContent = game.tribalReputation;

    document.getElementById('gather-btn').disabled = game.gatherCooldown > 0;
    document.getElementById('build-city-btn').disabled = !hasResources({food: 200, metal: 200, energy: 100});
    document.getElementById('build-road-btn').disabled = !game.selectedCity || !hasResources({metal: 100, energy: 50}) || game.placingCity;

    document.getElementById('recruit-infantry-btn').disabled = !hasResources({food: 50, metal: 50, energy: 0}) || totalPop < 50;
    document.getElementById('recruit-cavalry-btn').disabled = !hasResources({food: 100, metal: 100, energy: 50}) || totalPop < 100;
    document.getElementById('recruit-artillery-btn').disabled = !hasResources({food: 50, metal: 300, energy: 150}) || totalPop < 10;

    document.getElementById('charity-small-btn').disabled = !hasResources({food: 30, metal: 15, energy: 5});
    document.getElementById('charity-medium-btn').disabled = !hasResources({food: 90, metal: 45, energy: 15});
    document.getElementById('charity-large-btn').disabled = !hasResources({food: 240, metal: 120, energy: 40});

    if (game.tribalTradeCooldown > 0) {
        game.tribalTradeCooldown--;
        document.getElementById('trade-btn').disabled = true;
        const yearsLeft = Math.ceil(game.tribalTradeCooldown / 100);
        document.getElementById('trade-btn').textContent = `Trade (${yearsLeft}yr)`;
    } else {
        document.getElementById('trade-btn').disabled = game.resources.food < 80 || game.tribalRelation === 'war' || game.tribalsDefeated;
        document.getElementById('trade-btn').textContent = 'Trade (80F→80M)';
    }

    document.getElementById('embassy-btn').disabled = !hasResources({food: 200, metal: 200, energy: 100}) || game.hasEmbassy || game.tribalRelation === 'war' || game.tribalsDefeated;
    document.getElementById('denounce-btn').disabled = game.tribalRelation === 'war' || game.tribalsDefeated;
    document.getElementById('declare-war-btn').disabled = game.tribalRelation === 'war' || game.tribalsDefeated || game.peaceTreatyCooldown > 0;

    if (game.peaceTreatyCooldown > 0) {
    const yearsLeft = Math.ceil(game.peaceTreatyCooldown / 100);
    document.getElementById('declare-war-btn').textContent = `Treaty (${yearsLeft}yr)`;
    } else {
    document.getElementById('declare-war-btn').textContent = 'War';
    }

    if (game.hasEmbassy) {
        document.getElementById('embassy-btn').textContent = 'Embassy ✓';
    }

    const negotiateBtn = document.getElementById('negotiate-peace-btn');
    if (game.tribalRelation === 'war' && !game.peaceTalksActive && !game.tribalsDefeated) {
    negotiateBtn.style.display = 'block';
    negotiateBtn.disabled = (game.resources.food + game.resources.metal + game.resources.energy) < 1000;
    } else {
    negotiateBtn.style.display = 'none';
    }

    if (game.peaceTalksActive) {
    negotiateBtn.textContent = `Talks in Progress (Year ${Math.floor(game.peaceTalksTimer) + 1}/3)`;
    negotiateBtn.disabled = true;
    }


    const repFill = document.getElementById('reputation-fill');
    repFill.style.width = `${game.tribalReputation}%`;
    document.getElementById('reputation-text').textContent = `${game.tribalReputation}/100`;

    let statusText = '';
    if (game.tribalsDefeated) {
        statusText = 'Defeated';
    } else if (game.tribalReputation <= 20) {
        statusText = 'WAR';
    } else if (game.tribalReputation <= 40) {
        statusText = 'Hostile';
    } else if (game.tribalReputation <= 60) {
        statusText = 'Neutral';
    } else if (game.tribalReputation <= 80) {
        statusText = 'Friendly';
    } else {
        statusText = 'Allied';
    }
    document.getElementById('tribal-status').textContent = `Status: ${statusText}`;

    updateTribalRelation();
    updateSpaceportPanel();

    const progressDisplay = document.getElementById('victory-progress-display') || (() => {
        const div = document.createElement('div');
        div.id = 'victory-progress-display';
        document.body.appendChild(div);
        return div;
    })();
    progressDisplay.textContent = `Victory: ${VictoryConditions.conditions[VictoryConditions.selectedCondition].name} - ${VictoryConditions.getProgressText()}`;
}

    if (game.tribalTradeCooldown > 0) {
    game.tribalTradeCooldown--;
    document.getElementById('trade-btn').disabled = true;
    const yearsLeft = Math.ceil(game.tribalTradeCooldown / 100);
    document.getElementById('trade-btn').textContent = `Trade (${yearsLeft}yr)`;
    } else {
    document.getElementById('trade-btn').disabled = !hasResources({food: 60, metal: 30, energy: 10}) || game.tribalRelation === 'war' || game.tribalsDefeated;
    document.getElementById('trade-btn').textContent = 'Trade (100→+220)';
    }

    document.getElementById('planet-view').addEventListener('click', handlePlanetClick);
    document.getElementById('planet-view').addEventListener('mousemove', handlePlanetMove);
    document.getElementById('planet-view').addEventListener('mouseleave', () => {
        if (game.placingCity) {
            document.getElementById('placement-preview').classList.remove('active');
            updateBuildCityButtonText(0, 0);
        }
        if (!game.selectedCity) {
            document.getElementById('placement-radius').classList.remove('active');
        }
    });

    document.getElementById('gather-btn').onclick = gatherResources;
    document.getElementById('build-city-btn').onclick = startCityPlacement;
    document.getElementById('build-road-btn').onclick = startRoadBuilding;

    document.getElementById('charity-small-btn').onclick = () => provideCharity({ food: 30, metal: 15, energy: 5 }, 5);
    document.getElementById('charity-medium-btn').onclick = () => provideCharity({ food: 90, metal: 45, energy: 15 }, 15);
    document.getElementById('charity-large-btn').onclick = () => provideCharity({ food: 240, metal: 120, energy: 40 }, 35);

    document.getElementById('recruit-infantry-btn').onclick = () => recruitUnit('infantry');
    document.getElementById('recruit-cavalry-btn').onclick = () => recruitUnit('cavalry');
    document.getElementById('recruit-artillery-btn').onclick = () => recruitUnit('artillery');

    document.getElementById('trade-btn').onclick = tribalTrade;
    document.getElementById('embassy-btn').onclick = buildEmbassy;
    document.getElementById('denounce-btn').onclick = denounceTribes;
    document.getElementById('declare-war-btn').onclick = declareWar;
    document.getElementById('negotiate-peace-btn').onclick = initiatePeaceTalks;

    document.getElementById('spaceport-btn').onclick = toggleSpaceportPanel;
    document.getElementById('start-spaceport-btn').onclick = startSpaceportConstruction;

    document.querySelectorAll('.formation-option').forEach(option => {
    option.addEventListener('click', () => {
    document.querySelectorAll('.formation-option').forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
    game.battleFormation = option.getAttribute('data-formation');

    if (game.currentBattle) {
        openBattlePlanningScreen(game.currentBattle);
    }
    });
    });
    document.getElementById('zoom-in-btn').onclick = () => updateZoom(0.1);
    document.getElementById('zoom-out-btn').onclick = () => updateZoom(-0.1);

    const mainGame = document.getElementById('main-game');
    mainGame.addEventListener('mousedown', (e) => {
        if (game.placingCity) return;
        isDragging = true;
        dragStartX = e.clientX - mapPanX;
        dragStartY = e.clientY - mapPanY;
    });

    mainGame.addEventListener('mousemove', (e) => {
        if (isDragging && !game.placingCity) {
            mapPanX = e.clientX - dragStartX;
            mapPanY = e.clientY - dragStartY;
            applyMapTransform();
        }
    });

    mainGame.addEventListener('mouseup', () => {
        isDragging = false;
    });

    mainGame.addEventListener('wheel', (e) => {
        e.preventDefault();
        updateZoom(e.deltaY > 0 ? -0.05 : 0.05);
    }, { passive: false });

    document.getElementById('minimap').addEventListener('click', (e) => {
        const minimap = document.getElementById('minimap');
        const rect = minimap.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const mainGame = document.getElementById('main-game');
        const gameRect = mainGame.getBoundingClientRect();
        const planetWidth = gameRect.width * 10;
        const planetHeight = gameRect.height * 10;

        const scaledWidth = planetWidth * mapZoom;
        const scaledHeight = planetHeight * mapZoom;

        mapPanX = -(x * scaledWidth) + (gameRect.width / 2);
        mapPanY = -(y * scaledHeight) + (gameRect.height / 2);

        applyMapTransform();
        updateMinimap();
    });

    document.getElementById('retreat-slider').addEventListener('input', (e) => {
        game.retreatThreshold = parseInt(e.target.value);
        document.getElementById('retreat-value').textContent = game.retreatThreshold;
    });

    document.querySelectorAll('.law-option').forEach(option => {
        option.onclick = () => {
            const law = option.getAttribute('data-law');
            setLaw(law);
        };
    });

    document.getElementById('pause-btn').onclick = () => {
        game.paused = !game.paused;
        document.getElementById('pause-btn').textContent = game.paused ? 'Resume' : 'Pause';
    };

    document.addEventListener('keydown', (e) => {
        if (game.ddrActive) {
            if (['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                handleDDRInput(e.key);
            }
        } else if (e.key === 'Escape') {
            cancelCityPlacement();
            game.buildingRoad = false;
            game.roadStartCity = null;
            document.getElementById('build-road-btn').classList.remove('active');
            document.getElementById('spaceport-panel').style.display = 'none';
        }
    });
