/**
 * ============================================================================
 *  constants.ts — CONSTANTES DE CONFIGURAÇÃO (BALANCEAMENTO)
 * ============================================================================
 *
 *  Centraliza os "números mágicos" do jogo num único lugar. Em vez de espalhar
 *  valores como velocidade, tempo de recarga e pontuação por todo o código,
 *  reunimos tudo aqui.
 *
 *  Vantagem didática e prática: para AJUSTAR a dificuldade ou o "feeling" do
 *  jogo (o chamado *game balancing*), basta editar este arquivo — sem precisar
 *  caçar valores soltos em dezenas de arquivos.
 *
 *  Obs.: alguns destes valores são "fonte da verdade" e realmente usados;
 *  outros servem como referência/documentação do balanceamento pretendido,
 *  pois certas entidades definem velocidades próprias internamente.
 * ============================================================================
 */

export const CONFIG = {
    WIDTH: 800,                        // Largura da tela do jogo (px)
    HEIGHT: 600,                       // Altura da tela do jogo (px)
    PLAYER_SPEED: 350,                 // Velocidade de movimento do jogador (px/s)
    PLAYER_SHOOT_COOLDOWN: 250,        // Tempo mínimo entre tiros do jogador (ms)
    ENEMY_BASE_SPEED: 130,             // Velocidade-base de descida dos inimigos (px/s)
    ENEMY_SHOOT_DELAY: 1500,           // cada inimigo atira após esse tempo (ms)
    BULLET_SPEED: -450,                // Velocidade da bala do jogador (negativo = sobe na tela)
    ENEMY_BULLET_SPEED: 280,           // Velocidade da bala inimiga (px/s)
    COIN_VALUE: 10,                    // Pontos ganhos ao coletar uma moeda
    ENEMY_VALUE: 20,                   // Pontos ganhos ao destruir um inimigo
    PLAYER_INVINCIBLE_DURATION: 1500,  // Duração da invencibilidade após tomar dano (ms)
    PLAYER_MAX_HEALTH: 3,              // Vidas iniciais do jogador (sem upgrades)
    SPAWN_ENEMY_DELAY: 1200,           // Intervalo inicial entre surgimento de inimigos (ms)
    SPAWN_COIN_DELAY: 800,             // Intervalo entre surgimento de moedas (ms)
    DIFFICULTY_INCREASE_INTERVAL: 10000, // De quanto em quanto tempo a dificuldade sobe (ms)
    MIN_ENEMY_SPAWN_DELAY: 400,        // Piso do intervalo de spawn: nunca mais rápido que isso (ms)
};
