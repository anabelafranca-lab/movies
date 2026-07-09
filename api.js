/**
 * api.js — Funções de consumo da OMDb API
 * ==========================================
 * Responsabilidade: toda comunicação com a API externa.
 * Utiliza Fetch API com async/await e tratamento de erros (try-catch).
 *
 * API: OMDb — https://www.omdbapi.com/
 */

// ── Constantes de configuração ──────────────────────────────
const API_KEY  = '8e8039a8';
const BASE_URL = 'https://www.omdbapi.com/';

/**
 * Busca filmes pelo título com suporte a paginação.
 * Utiliza async/await e Fetch API.
 *
 * @param {string} query - Termo de busca digitado pelo usuário
 * @param {number} page  - Número da página (cada página retorna 10 filmes)
 * @returns {Promise<{movies: Array, totalResults: number}>}
 */
export async function searchMovies(query, page = 1) {
  // Template literal para montar a URL dinamicamente
  const url = `${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie&page=${page}`;

  try {
    // Fetch API — requisição assíncrona
    const response = await fetch(url);

    // Verifica se a resposta HTTP foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    // Converte a resposta para JSON
    const data = await response.json();

    // OMDb retorna Response: "False" quando não há resultados
    if (data.Response === 'False') {
      throw new Error(data.Error || 'Nenhum resultado encontrado.');
    }

    return {
      movies:       data.Search || [],
      totalResults: parseInt(data.totalResults, 10) || 0,
    };

  } catch (error) {
    // Propaga o erro para ser tratado em quem chamou a função
    throw new Error(error.message || 'Falha ao conectar com a API.');
  }
}

/**
 * Busca detalhes completos de um filme pelo IMDb ID.
 * Retorna poster, sinopse, nota, elenco, diretor, etc.
 *
 * @param {string} imdbID - ID único do filme no IMDb (ex: tt0111161)
 * @returns {Promise<Object>}
 */
export async function getMovieDetails(imdbID) {
  const url = `${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.Response === 'False') {
      throw new Error(data.Error || 'Filme não encontrado.');
    }

    return data;

  } catch (error) {
    throw new Error(error.message || 'Erro ao buscar detalhes do filme.');
  }
}

/**
 * Lista de gêneros disponíveis para filtro.
 * Usados no <select> de gênero na interface.
 */
export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy',
  'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror',
  'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western',
];

/**
 * IMDb IDs dos filmes do catálogo inicial.
 * Carregados em paralelo com Promise.all ao abrir o site.
 */
export const CATALOG_IDS = [
  'tt0111161', // The Shawshank Redemption
  'tt0068646', // The Godfather
  'tt0468569', // The Dark Knight
  'tt0071562', // The Godfather Part II
  'tt0050083', // 12 Angry Men
  'tt0108052', // Schindler's List
  'tt0167260', // The Lord of the Rings: Return of the King
  'tt0110912', // Pulp Fiction
  'tt0060196', // The Good, the Bad and the Ugly
  'tt0137523', // Fight Club
  'tt0120737', // The Fellowship of the Ring
  'tt0109830', // Forrest Gump
  'tt0816692', // Interstellar
  'tt0133093', // The Matrix
  'tt0099685', // Goodfellas
  'tt0073486', // One Flew Over the Cuckoo's Nest
  'tt0114369', // Se7en
  'tt0102926', // The Silence of the Lambs
  'tt0172495', // Gladiator
  'tt0245429', // Spirited Away
];
