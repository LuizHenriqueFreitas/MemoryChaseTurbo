/**
 * ============================================================================
 *  SaveData.ts — PERSISTÊNCIA DE PROGRESSO E ECONOMIA DOS UPGRADES
 * ============================================================================
 *
 *  Este módulo é o "cofre" do jogo. Ele cuida de duas coisas:
 *
 *   1) SALVAR / CARREGAR o progresso do jogador usando o `localStorage` do
 *      navegador (uma pequena base de dados chave→valor que sobrevive ao
 *      fechar a aba/janela). Tudo é guardado como TEXTO no formato JSON.
 *
 *   2) Definir a ECONOMIA dos upgrades: quanto custa cada nível de melhoria e
 *      quais benefícios cada nível concede (chance de surgir, duração, etc.).
 *
 *  Conceito-chave: separamos "dados" (a interface SaveData) de "regras"
 *  (as funções getXxxCost / getXxxDuration). Assim, a loja (UpgradeScene) e o
 *  jogo (GameScene) consultam SEMPRE as mesmas funções, evitando divergências.
 * ============================================================================
 */

/**
 * Formato (contrato) dos dados salvos. Cada campo é um nível de progresso
 * persistente do jogador. `totalPoints` é a "carteira" (moeda do jogo).
 */
export interface SaveData {
    totalPoints: number;         // Pontos acumulados (moeda para comprar upgrades)
    healthUpgradeLevel: number;  // Nível de "vidas extras" (0 a 5)
    magnetLevel: number;         // Nível do campo magnético que atrai moedas
    shieldLevel: number;         // Nível do escudo protetor (0 a 3)
    timeWarpLevel: number;       // Nível do poder Espaço-Tempo (0 a 3)
    weaponLevel: number;         // Índice da arma equipada (0, 1 ou 2)
}

/** Estado inicial de um jogador novo — tudo zerado. */
const DEFAULT_SAVE: SaveData = {
    totalPoints: 0,
    healthUpgradeLevel: 0,
    magnetLevel: 0,
    shieldLevel: 0,
    timeWarpLevel: 0,
    weaponLevel: 0
};

/**
 * Lê o save do `localStorage` e o devolve como objeto.
 * Se não houver save (primeira vez jogando), retorna uma CÓPIA do padrão.
 *
 * Detalhe importante (compatibilidade): o campo `timeWarpLevel` foi adicionado
 * depois. Saves antigos não o possuem, então preenchemos com 0 para evitar
 * `undefined` quebrar contas mais adiante. Isso se chama "migração de save".
 */
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
    // Espalhamos (...) para devolver uma cópia, e não a referência ao padrão.
    return { ...DEFAULT_SAVE };
}

/** Grava o objeto de save no `localStorage`, convertendo-o em texto JSON. */
export function saveSave(data: SaveData): void {
    localStorage.setItem('memoryChaseSave', JSON.stringify(data));
}

/** Apaga completamente o save (usado pelo botão "Limpar Save" do menu). */
export function clearSave(): void {
    localStorage.removeItem('memoryChaseSave');
}

// ==================== HEALTH UPGRADE (VIDAS EXTRAS) ====================
/**
 * Calcula o custo do próximo nível de vida.
 *
 * A curva de preço é PROGRESSIVA e agressiva: começa em 350 e, a cada nível,
 * é reaplicada a fórmula `preço^1.8 / 2 + 50`. Como o expoente é maior que 1,
 * o custo dispara rapidamente (crescimento super-linear), tornando os últimos
 * níveis bem caros. Um teto de 1.000.000 evita que o número exploda.
 *
 * Retorna -1 quando o nível máximo (5) já foi atingido — convenção usada por
 * todo o código para significar "esgotado / MAX".
 */
export function getHealthUpgradeCost(currentLevel: number): number {
    if (currentLevel >= 5) return -1;
    let price = 350;
    for (let i = 0; i < currentLevel; i++) {
        price = Math.floor(Math.pow(price, 1.8) / 2 + 50);
        if (price > 1_000_000) price = 1_000_000;
    }
    return price;
}

// ==================== MAGNET UPGRADE (CAMPO MAGNÉTICO) ====================
/**
 * Custo do campo magnético: crescimento EXPONENCIAL puro.
 * Preço = 500 * 3^nível  →  500, 1500, 4500, 13500, ...
 * Cada nível custa o triplo do anterior.
 */
export function getMagnetUpgradeCost(currentLevel: number): number {
    const basePrice = 500;
    return Math.floor(basePrice * Math.pow(3, currentLevel));
}

// ==================== SHIELD UPGRADE (ESCUDO) ====================
/**
 * Custo do escudo. Aqui usamos uma TABELA fixa (não uma fórmula), pois são
 * poucos níveis e queremos preços "redondos" e controlados manualmente.
 * Retorna -1 no nível máximo (3).
 */
export function getShieldUpgradeCost(currentLevel: number): number {
    if (currentLevel >= 3) return -1;
    const prices: { [key: number]: number } = {
        0: 10000,
        1: 20000,
        2: 40000
    };
    return prices[currentLevel] || 0;
}

/**
 * Chance (em %) de um item de escudo surgir junto com um inimigo.
 * Quanto maior o nível, mais frequente o item aparece.
 */
export function getShieldSpawnChance(shieldLevel: number): number {
    const chances: { [key: number]: number } = {
        0: 0,
        1: 2,   // 2%
        2: 4,   // 4%
        3: 6    // 6%
    };
    return chances[shieldLevel] || 0;
}

/** Duração (em segundos) do escudo ao ser coletado, conforme o nível. */
export function getShieldDuration(shieldLevel: number): number {
    const durations: { [key: number]: number } = {
        0: 0,
        1: 3,
        2: 7,
        3: 10
    };
    return durations[shieldLevel] || 0;
}

// ==================== TIMEWARP UPGRADE (ESPAÇO-TEMPO) ====================
/** Chance (em %) de surgir um item de Espaço-Tempo, conforme o nível. */
export function getTimeWarpSpawnChance(level: number): number {
    const chances: { [key: number]: number } = {
        0: 0,
        1: 3,   // 3%
        2: 5,   // 5%
        3: 7    // 7%
    };
    return chances[level] || 0;
}

/** Duração (em segundos) do poder Espaço-Tempo, conforme o nível. */
export function getTimeWarpDuration(level: number): number {
    const durations: { [key: number]: number } = {
        0: 0,
        1: 10,
        2: 15,
        3: 20
    };
    return durations[level] || 0;
}

/**
 * Custo do upgrade de Espaço-Tempo (tabela fixa). Retorna -1 no nível máximo.
 * Note o uso de `??` (nullish coalescing): só cai no -1 se a chave não existir.
 */
export function getTimeWarpUpgradeCost(currentLevel: number): number {
    if (currentLevel >= 3) return -1;

    const prices: { [key: number]: number } = {
        0: 15000,
        1: 30000,
        2: 60000
    };
    return prices[currentLevel] ?? -1;
}
