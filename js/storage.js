/**
 * storage.js — Funções de persistência com LocalStorage
 * =========================================================
 * Responsabilidade: salvar e recuperar dados no navegador.
 * Utiliza JSON.stringify() e JSON.parse() para serialização.
 * Isola toda lógica de armazenamento em um único módulo.
 */

// ── Chaves do LocalStorage ───────────────────────────────────
const KEYS = {
  FAVORITES: 'cinescope_favorites', // Array de objetos de filmes
  HISTORY:   'cinescope_history',   // Array de strings (buscas)
  THEME:     'cinescope_theme',     // 'light' ou 'dark'
  SEARCHES:  'cinescope_searches',  // Contador numérico
};

/* ── FAVORITOS ──────────────────────────────────────────────── */

/**
 * Retorna todos os filmes favoritados.
 * Usa JSON.parse() para converter a string do LocalStorage em Array.
 * @returns {Array<Object>}
 */
export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.FAVORITES)) || [];
  } catch {
    return []; // Retorna array vazio se o JSON estiver corrompido
  }
}

/**
 * Adiciona ou remove um filme dos favoritos (toggle).
 * Usa JSON.stringify() para salvar o array como string.
 *
 * @param {Object} movie - Objeto com dados do filme
 * @returns {boolean} true se adicionado, false se removido
 */
export function toggleFavorite(movie) {
  const favorites = getFavorites();
  const index     = favorites.findIndex(f => f.imdbID === movie.imdbID);

  if (index >= 0) {
    // Filme já existe: remove do array
    favorites.splice(index, 1);
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    return false;
  } else {
    // Filme novo: adiciona no início da lista
    favorites.unshift(movie);
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    return true;
  }
}

/**
 * Verifica se um filme está nos favoritos.
 * @param {string} imdbID
 * @returns {boolean}
 */
export function isFavorite(imdbID) {
  return getFavorites().some(f => f.imdbID === imdbID);
}

/**
 * Remove todos os filmes favoritos do LocalStorage.
 */
export function clearFavorites() {
  localStorage.removeItem(KEYS.FAVORITES);
}

/* ── HISTÓRICO DE BUSCAS ────────────────────────────────────── */

/**
 * Retorna as últimas buscas realizadas (máximo 8).
 * @returns {Array<string>}
 */
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
  } catch {
    return [];
  }
}

/**
 * Adiciona uma busca ao histórico.
 * Remove duplicatas e limita a 8 itens.
 * @param {string} query
 */
export function addToHistory(query) {
  // Remove o termo se já existir (evita duplicatas)
  const history = getHistory().filter(h => h.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  // Mantém apenas os 8 mais recentes
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 8)));
}

/* ── CONTAGEM DE BUSCAS ─────────────────────────────────────── */

/**
 * Incrementa e retorna o contador de buscas realizadas.
 * @returns {number}
 */
export function incrementSearchCount() {
  const next = getSearchCount() + 1;
  localStorage.setItem(KEYS.SEARCHES, String(next));
  return next;
}

/**
 * Retorna o total de buscas realizadas.
 * @returns {number}
 */
export function getSearchCount() {
  return parseInt(localStorage.getItem(KEYS.SEARCHES) || '0', 10);
}

/* ── TEMA ───────────────────────────────────────────────────── */

/**
 * Salva a preferência de tema do usuário.
 * @param {'light'|'dark'} theme
 */
export function saveTheme(theme) {
  localStorage.setItem(KEYS.THEME, theme);
}

/**
 * Retorna o tema salvo, com fallback para 'light'.
 * @returns {'light'|'dark'}
 */
export function getSavedTheme() {
  return localStorage.getItem(KEYS.THEME) || 'light';
}