export interface SaveData {
    totalPoints: number;
    healthUpgradeLevel: number; // 0 a 5
    magnetLevel: number;
}

const DEFAULT_SAVE: SaveData = {
    totalPoints: 0,
    healthUpgradeLevel: 0,
    magnetLevel: 0
};

export function loadSave(): SaveData {
        const data = localStorage.getItem('memoryChaseSave');
        if (data) {
            const parsed = JSON.parse(data);
            // Garantir que todos os campos existam
            return {
                totalPoints: parsed.totalPoints ?? 0,
                healthUpgradeLevel: parsed.healthUpgradeLevel ?? 0,
                magnetLevel: parsed.magnetLevel ?? 0
            };
        }
        return { totalPoints: 0, healthUpgradeLevel: 0, magnetLevel: 0 };
    }

export function saveSave(data: SaveData): void {
    localStorage.setItem('memoryChaseSave', JSON.stringify(data));
}

export function clearSave(): void {
    localStorage.removeItem('memoryChaseSave');
}

// Preço upgrade de vida: fórmula (anterior^1.8)/2 + 50, começa 350
export function getHealthUpgradeCost(currentLevel: number): number {
    if (currentLevel >= 5) return -1;
    let price = 350;
    for (let i = 0; i < currentLevel; i++) {
        price = Math.floor(Math.pow(price, 1.8) / 2 + 50);
        if (price > 1_000_000) price = 1_000_000;
    }
    return price;
}

// Preço upgrade magnetismo: base 500 * 3^level
export function getMagnetUpgradeCost(currentLevel: number): number {
    const basePrice = 500;
    return Math.floor(basePrice * Math.pow(3, currentLevel));
}