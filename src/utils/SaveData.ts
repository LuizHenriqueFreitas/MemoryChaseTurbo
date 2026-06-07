export interface SaveData {
    totalPoints: number;
    healthUpgradeLevel: number;
    magnetLevel: number;
    shieldLevel: number;
    timeWarpLevel: number;
    weaponLevel: number;
}

const DEFAULT_SAVE: SaveData = {
    totalPoints: 0,
    healthUpgradeLevel: 0,
    magnetLevel: 0,
    shieldLevel: 0,
    timeWarpLevel: 0,
    weaponLevel: 0
};

export function loadSave(): SaveData {
    const data = localStorage.getItem('memoryChaseSave');
    if (data) {
        const parsed = JSON.parse(data);
        // Garantir que timeWarpLevel existe (para saves antigos)
        if (parsed.timeWarpLevel === undefined) {
            parsed.timeWarpLevel = 0;
        }
        return parsed;
    }
    return { ...DEFAULT_SAVE };
}

export function saveSave(data: SaveData): void {
    localStorage.setItem('memoryChaseSave', JSON.stringify(data));
}

export function clearSave(): void {
    localStorage.removeItem('memoryChaseSave');
}

// ==================== HEALTH UPGRADE ====================
export function getHealthUpgradeCost(currentLevel: number): number {
    if (currentLevel >= 5) return -1;
    let price = 350;
    for (let i = 0; i < currentLevel; i++) {
        price = Math.floor(Math.pow(price, 1.8) / 2 + 50);
        if (price > 1_000_000) price = 1_000_000;
    }
    return price;
}

// ==================== MAGNET UPGRADE ====================
export function getMagnetUpgradeCost(currentLevel: number): number {
    const basePrice = 500;
    return Math.floor(basePrice * Math.pow(3, currentLevel));
}

// ==================== SHIELD UPGRADE ====================
export function getShieldUpgradeCost(currentLevel: number): number {
    if (currentLevel >= 3) return -1;
    const prices: { [key: number]: number } = {
        0: 10000,
        1: 20000,
        2: 40000
    };
    return prices[currentLevel] || 0;
}

export function getShieldSpawnChance(shieldLevel: number): number {
    const chances: { [key: number]: number } = {
        0: 0,
        1: 2,   // 2%
        2: 4,   // 4%
        3: 6    // 6%
    };
    return chances[shieldLevel] || 0;
}

export function getShieldDuration(shieldLevel: number): number {
    const durations: { [key: number]: number } = {
        0: 0,
        1: 3,
        2: 7,
        3: 10
    };
    return durations[shieldLevel] || 0;
}

// ==================== TIMEWARP UPGRADE ====================
export function getTimeWarpSpawnChance(level: number): number {
    const chances: { [key: number]: number } = {
        0: 0,
        1: 3,   // 3%
        2: 5,   // 5%
        3: 7    // 7%
    };
    return chances[level] || 0;
}

export function getTimeWarpDuration(level: number): number {
    const durations: { [key: number]: number } = {
        0: 0,
        1: 10,
        2: 15,
        3: 20
    };
    return durations[level] || 0;
}

// 🔴 FUNÇÃO CORRIGIDA - TimeWarp Preço
export function getTimeWarpUpgradeCost(currentLevel: number): number {
    console.log(`getTimeWarpUpgradeCost chamado com nível: ${currentLevel}`);
    
    // Se já está no nível máximo (3), retorna -1
    if (currentLevel >= 3) {
        return -1;
    }
    
    // Preços para cada nível
    if (currentLevel === 0) return 15000;
    if (currentLevel === 1) return 30000;
    if (currentLevel === 2) return 60000;
    
    return -1;
}