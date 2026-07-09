/**
 * app.js — Controlador principal do CineScope
 * =============================================
 * Responsabilidade: manipulação do DOM, eventos e orquestração
 * entre api.js (dados externos) e storage.js (persistência local).
 *
 * Técnicas demonstradas:
 * ✔ querySelector / querySelectorAll
 * ✔ Criação dinâmica de elementos (createElement, innerHTML)
 * ✔ Modificação de conteúdo e atributos (textContent, dataset, classList)
 * ✔ Event listeners: click, submit, input, change, keydown
 * ✔ Event delegation nos grids de filmes
 * ✔ Prevenção de comportamento default (preventDefault)
 * ✔ Fetch API com async/await em api.js
 * ✔ Promise.all para requisições paralelas
 * ✔ Tratamento de erros com try/catch/finally
 * ✔ Loading states e feedback visual (spinner, toast, erro)
 * ✔ LocalStorage via storage.js (JSON.stringify/parse)
 * ✔ Template literals para geração de HTML dinâmico
 * ✔ Arrow functions e const/let
 * ✔ Código modular (api.js / storage.js / charts.js / app.js)
 */

import { searchMovies, getMovieDetails, GENRES, CATALOG_IDS } from './api.js';
import {
  getFavorites, toggleFavorite, isFavorite, clearFavorites,
  getHistory, addToHistory, incrementSearchCount, getSearchCount,
  saveTheme, getSavedTheme,
} from './storage.js';
import { renderFavChart } from './charts.js';

/* ═══════════════════════════════════════════════════════════
   ESTADO DA APLICAÇÃO
   Gerenciamento de estado centralizado (sem frameworks).
═══════════════════════════════════════════════════════════ */
const state = {
  currentQuery: '',       // Último termo buscado
  currentPage:  1,        // Página atual da paginação
  totalPages:   1,        // Total de páginas disponíveis
  activeTab:    'catalogo', // Aba ativa
  genreFilter:  '',       // Gênero selecionado para filtro
  allResults:   [],       // Cache dos resultados para filtro local
};

/* ═══════════════════════════════════════════════════════════
   SELETORES DO DOM
   Função auxiliar $ reduz verbosidade de document.getElementById.
═══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

// Elementos de navegação
const searchForm      = $('search-form');
const searchInput     = $('search-input');
const btnSearch       = $('btn-search');
const formError       = $('form-error');
const btnToggle       = $('btn-toggle');
const btnHome         = $('btn-home');

// Grids de filmes
const catalogGrid     = $('catalog-grid');
const moviesGrid      = $('movies-grid');
const favGrid         = $('fav-grid');

// Seções
const catalogSection  = $('section-catalogo');
const resultsSection  = $('results-section');
const favSection      = $('section-favoritos');

// Loading e erros
const loadingCatalogo = $('loading-catalogo');
const loading         = $('loading');
const errorMsg        = $('error-msg');
const errorText       = $('error-text');

// Paginação
const pagination      = $('pagination');
const btnPrev         = $('btn-prev');
const btnNext         = $('btn-next');
const pageIndicator   = $('page-indicator');
const paginationInfo  = $('pagination-info');

// Favoritos
const badgeFav        = $('badge-fav');
const emptyFav        = $('empty-fav');
const btnClearFav     = $('btn-clear-fav');
const genreSelect     = $('genre-select');         // filtro favoritos
const genreFilterBusca = $('genre-filter-busca');  // filtro busca

// Estatísticas e histórico
const statTotal       = $('stat-total');
const statAvg         = $('stat-avg');
const statSearches    = $('stat-searches');
const historyBar      = $('history-bar');

// Modal
const modalOverlay    = $('modal-overlay');
const modalContent    = $('modal-content');
const modalClose      = $('modal-close');

// Toast de feedback
const toast           = $('toast');

/* ═══════════════════════════════════════════════════════════
   INICIALIZAÇÃO
   Configura o estado inicial e registra todos os eventos.
═══════════════════════════════════════════════════════════ */
function init() {
  // ── Restaura tema salvo no LocalStorage ──
  const savedTheme        = getSavedTheme();
  document.body.className = savedTheme;
  btnToggle.textContent   = savedTheme === 'dark' ? '☀️' : '🌙';

  // ── Preenche selects de gênero dinamicamente ──
  // querySelectorAll: seleciona ambos os selects de gênero
  const genreSelects = document.querySelectorAll('#genre-select, #genre-filter-busca');
  GENRES.forEach(g => {
    genreSelects.forEach(sel => {
      // createElement: criação dinâmica de elemento option
      const opt       = document.createElement('option');
      opt.value       = g;
      opt.textContent = g; // Modificação de conteúdo
      sel.appendChild(opt);
    });
  });

  // ── Carrega catálogo e dados persistidos ──
  loadCatalog();
  updateStats();
  renderHistory();
  updateFavBadge();

  /* ────────────────────────────────────────────────────────
     EVENT LISTENERS
     Cada evento é registrado com addEventListener.
  ──────────────────────────────────────────────────────── */

  // Formulário de busca
  // 'submit': dispara ao clicar em Buscar ou pressionar Enter
  searchForm.addEventListener('submit', e => {
    e.preventDefault(); // Prevenção de comportamento default (recarregar página)

    const q = searchInput.value.trim();

    // Validação do formulário com feedback visual
    if (!q) {
      formError.classList.remove('hidden'); // Modificação de classe CSS
      searchInput.focus();
      return;
    }

    formError.classList.add('hidden');
    state.currentQuery = q;
    state.currentPage  = 1;
    switchTab('buscar');
    doSearch();
  });

  // 'input': feedback em tempo real enquanto o usuário digita
  searchInput.addEventListener('input', () => {
    const hasText = searchInput.value.trim().length > 0;
    // Modificação de atributo 'disabled' dinamicamente
    btnSearch.disabled = !hasText;
    if (hasText) formError.classList.add('hidden');
  });

  // Tabs de navegação: querySelectorAll + forEach
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Paginação
  btnPrev.addEventListener('click', () => { state.currentPage--; doSearch(); });
  btnNext.addEventListener('click', () => { state.currentPage++; doSearch(); });

  // Alternar tema
  btnToggle.addEventListener('click', toggleTheme);

  // Logo → volta ao catálogo
  btnHome.addEventListener('click', e => {
    e.preventDefault();
    switchTab('catalogo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Filtro de gênero nos favoritos
  // 'change': dispara ao selecionar uma opção
  genreSelect.addEventListener('change', () => {
    state.genreFilter = genreSelect.value;
    renderFavorites();
  });

  // Filtro de gênero nos resultados de busca (filtragem local)
  genreFilterBusca.addEventListener('change', () => {
    state.genreFilter = genreFilterBusca.value;
    filterResultsByGenre();
  });

  // Fechar modal com botão X
  modalClose.addEventListener('click', closeModal);

  // Fechar modal clicando no overlay (fora do conteúdo)
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  // Fechar modal com tecla ESC
  // 'keydown': detecta qualquer tecla pressionada
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Limpar todos os favoritos
  btnClearFav.addEventListener('click', () => {
    if (!confirm('Deseja remover todos os favoritos?')) return;
    clearFavorites();
    renderFavorites();
    updateStats();
    updateFavBadge();
    refreshAllFavIcons();
    showToast('Todos os favoritos foram removidos.');
  });

  /* ────────────────────────────────────────────────────────
     EVENT DELEGATION nos grids de filmes
     Em vez de um listener por card, usamos UM listener no
     container pai que verifica qual filho foi clicado.
     Vantagem: funciona para elementos criados dinamicamente.
  ──────────────────────────────────────────────────────── */
  [catalogGrid, moviesGrid, favGrid].forEach(grid => {
    grid.addEventListener('click', async e => {
      // closest(): encontra o ancestral mais próximo que corresponde ao seletor
      const card   = e.target.closest('.movie-card');
      const favBtn = e.target.closest('.btn-fav');

      if (!card) return; // Clique fora de um card — ignora

      const imdbID = card.dataset.id;

      if (favBtn) {
        // Clicou no botão ❤️ / 🤍
        e.stopPropagation(); // Evita abrir o modal também
        await handleFavoriteDelegated(imdbID, card);
      } else {
        // Clicou em qualquer outra parte do card → abre modal
        openModal(imdbID);
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   CATÁLOGO INICIAL
   Carrega filmes populares em paralelo com Promise.all.
═══════════════════════════════════════════════════════════ */
async function loadCatalog() {
  loadingCatalogo.classList.remove('hidden');
  catalogGrid.innerHTML = '';

  try {
    // Promise.all: dispara todas as requisições simultaneamente
    // Muito mais rápido do que aguardar uma por uma (sequencial)
    const promises = CATALOG_IDS.map(id =>
      getMovieDetails(id).catch(() => null) // Ignora erros individuais sem travar tudo
    );
    const movies = (await Promise.all(promises)).filter(Boolean);

    loadingCatalogo.classList.add('hidden');

    // Criação dinâmica: um card para cada filme
    movies.forEach(movie => {
      const card = createMovieCard(movie);
      catalogGrid.appendChild(card);
    });

  } catch (err) {
    // Mensagem de erro amigável
    loadingCatalogo.innerHTML = `
      <div class="error-msg">
        <span>😕</span>
        <p>Erro ao carregar o catálogo: ${err.message}</p>
      </div>`;
  }
}

/* ═══════════════════════════════════════════════════════════
   BUSCA DE FILMES
   Requisição assíncrona com async/await e tratamento de erros.
═══════════════════════════════════════════════════════════ */
async function doSearch() {
  // Feedback visual: exibe loading
  showLoading(true);
  showError(false);
  pagination.classList.add('hidden');
  moviesGrid.innerHTML = '';

  // Scroll suave até os resultados
  window.scrollTo({
    top: document.querySelector('.hero').offsetHeight,
    behavior: 'smooth'
  });

  try {
    // Await: pausa a execução até a API responder
    const { movies, totalResults } = await searchMovies(
      state.currentQuery,
      state.currentPage
    );

    // Atualiza histórico e contador apenas na primeira página
    if (state.currentPage === 1) {
      incrementSearchCount();
      addToHistory(state.currentQuery);
      renderHistory();
      updateStats();
    }

    // Atualiza o estado com o total de páginas
    state.totalPages    = Math.ceil(totalResults / 10);
    state.allResults    = movies; // Cache para filtro local
    paginationInfo.textContent = `${totalResults} resultados encontrados`;

    // Renderiza os filmes (com filtro de gênero se ativo)
    const filtered = state.genreFilter
      ? movies.filter(m => m.Genre && m.Genre.includes(state.genreFilter))
      : movies;

    renderMovies(filtered, moviesGrid);
    updatePagination();

  } catch (err) {
    // try-catch: exibe mensagem amigável ao usuário
    showError(true, err.message);
  } finally {
    // finally: sempre executado, esconde o loading
    showLoading(false);
  }
}

/* ═══════════════════════════════════════════════════════════
   FILTRO LOCAL POR GÊNERO
   Filtra cards já exibidos sem nova requisição à API.
═══════════════════════════════════════════════════════════ */
function filterResultsByGenre() {
  // querySelectorAll: seleciona todos os cards do grid de resultados
  const cards = moviesGrid.querySelectorAll('.movie-card');

  cards.forEach(card => {
    const genre = card.dataset.genre || '';
    const match = !state.genreFilter || genre.includes(state.genreFilter);
    // Manipulação de classe CSS: mostra ou oculta o card
    card.classList.toggle('hidden', !match);
  });
}

/* ═══════════════════════════════════════════════════════════
   RENDERIZAÇÃO DE FILMES
═══════════════════════════════════════════════════════════ */
function renderMovies(movies, container) {
  container.innerHTML = ''; // Limpa o container

  if (!movies.length) {
    showError(true, 'Nenhum resultado para este filtro.');
    return;
  }

  // Arrow function no forEach
  movies.forEach(movie => {
    const card = createMovieCard(movie);
    container.appendChild(card); // Inserção dinâmica no DOM
  });
}

/**
 * Cria o elemento HTML de um card de filme.
 * Demonstra: createElement, template literals, dataset, classList.
 *
 * @param {Object} movie - Dados do filme
 * @returns {HTMLElement}
 */
function createMovieCard(movie) {
  const fav       = isFavorite(movie.imdbID);
  const hasPoster = movie.Poster && movie.Poster !== 'N/A';
  const rating    = movie.imdbRating && movie.imdbRating !== 'N/A'
    ? movie.imdbRating
    : null;

  // createElement: cria o div sem inserir no DOM ainda
  const card = document.createElement('div');
  card.className    = 'movie-card';
  // Modificação de atributos via dataset (acessíveis via event delegation)
  card.dataset.id   = movie.imdbID;
  card.dataset.genre = movie.Genre || '';

  // innerHTML com template literal: HTML dinâmico legível
  card.innerHTML = `
    ${hasPoster
      ? `<img
           class="movie-poster"
           src="${movie.Poster}"
           alt="Poster de ${movie.Title}"
           loading="lazy"
         >`
      : `<div class="movie-no-poster" aria-label="Sem poster">🎬</div>`
    }

    <button
      class="btn-fav ${fav ? 'favoritado' : ''}"
      data-id="${movie.imdbID}"
      title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
      aria-label="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
    >${fav ? '❤️' : '🤍'}</button>

    <div class="movie-info">
      <div class="movie-title">${movie.Title}</div>
      <div class="movie-meta">
        <span class="movie-year">${movie.Year || '—'}</span>
        ${rating ? `<span class="movie-rating">⭐ ${rating}</span>` : ''}
      </div>
      ${movie.Genre
        ? `<div class="movie-genre">${movie.Genre.split(',')[0].trim()}</div>`
        : ''
      }
    </div>
  `;

  return card;
}

/* ═══════════════════════════════════════════════════════════
   FAVORITOS
═══════════════════════════════════════════════════════════ */

/**
 * Gerencia toggle de favorito via event delegation.
 * Busca os dados do card no DOM para montar o objeto a salvar.
 *
 * @param {string} imdbID
 * @param {HTMLElement} card - Card clicado (pai do botão)
 */
async function handleFavoriteDelegated(imdbID, card) {
  // Verifica se já está nos favoritos para pegar os dados
  let movie = getFavorites().find(f => f.imdbID === imdbID);

  if (!movie) {
    // Monta objeto com dados visíveis no card (sem nova requisição)
    movie = {
      imdbID,
      Title:      card.querySelector('.movie-title')?.textContent || '',
      Year:       card.querySelector('.movie-year')?.textContent  || '',
      Poster:     card.querySelector('.movie-poster')?.src        || 'N/A',
      imdbRating: card.querySelector('.movie-rating')?.textContent?.replace('⭐ ', '') || 'N/A',
      Genre:      card.dataset.genre || '',
    };
  }

  const added = toggleFavorite(movie); // Salva/remove no LocalStorage

  // Feedback visual: toast de confirmação (funcionalidade criativa)
  showToast(added ? `❤️ "${movie.Title}" adicionado aos favoritos!` : `💔 "${movie.Title}" removido dos favoritos.`);

  // Sincroniza TODOS os botões deste filme em qualquer grid visível
  document.querySelectorAll(`.btn-fav[data-id="${imdbID}"]`).forEach(btn => {
    btn.className   = `btn-fav ${added ? 'favoritado' : ''}`;
    btn.textContent = added ? '❤️' : '🤍';
    btn.title       = added ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  });

  updateFavBadge();
  updateStats();
  if (state.activeTab === 'favoritos') renderFavorites();
}

/**
 * Renderiza a aba de favoritos com filtro de gênero opcional.
 * Atualiza o gráfico Chart.js após renderizar.
 */
function renderFavorites() {
  let favorites = getFavorites();

  // Filtro por gênero: cria novo array sem modificar o original
  if (state.genreFilter) {
    favorites = favorites.filter(f =>
      f.Genre && f.Genre.includes(state.genreFilter)
    );
  }

  favGrid.innerHTML = '';

  if (!favorites.length) {
    emptyFav.classList.remove('hidden');
    document.getElementById('chart-container').classList.add('hidden');
  } else {
    emptyFav.classList.add('hidden');
    favorites.forEach(m => favGrid.appendChild(createMovieCard(m)));
    // Renderiza o gráfico com os favoritos atuais (Chart.js)
    document.getElementById('chart-container').classList.remove('hidden');
    renderFavChart(favorites);
  }
}

/** Atualiza o badge numérico na aba de favoritos. */
function updateFavBadge() {
  const count            = getFavorites().length;
  badgeFav.textContent   = count;
  badgeFav.style.display = count > 0 ? 'inline' : 'none';
}

/** Atualiza ícones de favorito em todos os cards visíveis após limpar. */
function refreshAllFavIcons() {
  document.querySelectorAll('.btn-fav').forEach(btn => {
    const fav       = isFavorite(btn.dataset.id);
    btn.className   = `btn-fav ${fav ? 'favoritado' : ''}`;
    btn.textContent = fav ? '❤️' : '🤍';
  });
}

/* ═══════════════════════════════════════════════════════════
   MODAL DE DETALHES
   Exibe poster, sinopse, nota, elenco, diretor e premiações.
   Criação de HTML dinâmico com template literals.
═══════════════════════════════════════════════════════════ */

/**
 * Abre o modal com os detalhes completos do filme.
 * Realiza nova requisição para obter sinopse completa.
 *
 * @param {string} imdbID
 */
async function openModal(imdbID) {
  // Exibe o overlay e bloqueia o scroll
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Loading state enquanto a API responde
  modalContent.innerHTML = `
    <div class="loading" style="padding:3rem">
      <div class="spinner"></div>
      <p>Carregando detalhes...</p>
    </div>`;

  try {
    // Await: busca detalhes completos (sinopse longa, todos os campos)
    const movie  = await getMovieDetails(imdbID);
    const fav    = isFavorite(imdbID);
    const poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null;

    // Template literal: gera o HTML completo do modal dinamicamente
    modalContent.innerHTML = `
      <div class="modal-body">
        <div class="modal-poster">
          ${poster
            ? `<img src="${poster}" alt="Poster de ${movie.Title}">`
            : `<div class="movie-no-poster" style="height:280px">🎬</div>`
          }
        </div>

        <div class="modal-details">
          <h2 class="modal-title">${movie.Title}</h2>

          <!-- Gêneros como tags visuais -->
          <div class="modal-tags">
            ${movie.Genre
              ? movie.Genre.split(',')
                  .map(g => `<span class="tag">${g.trim()}</span>`)
                  .join('')
              : ''
            }
          </div>

          <!-- Nota IMDb em destaque -->
          <div class="modal-rating-big">
            ⭐ ${movie.imdbRating || '—'}
            <small>/ 10 &nbsp;·&nbsp; ${movie.imdbVotes || '—'} votos</small>
          </div>

          <!-- Sinopse completa -->
          <p class="modal-plot">${movie.Plot || 'Sinopse não disponível.'}</p>

          <!-- Grid de metadados -->
          <div class="modal-meta-grid">
            <div class="meta-item">
              <strong>Diretor</strong>
              <span>${movie.Director || '—'}</span>
            </div>
            <div class="meta-item">
              <strong>Elenco</strong>
              <span>${movie.Actors || '—'}</span>
            </div>
            <div class="meta-item">
              <strong>Ano</strong>
              <span>${movie.Year || '—'}</span>
            </div>
            <div class="meta-item">
              <strong>Duração</strong>
              <span>${movie.Runtime || '—'}</span>
            </div>
            <div class="meta-item">
              <strong>País</strong>
              <span>${movie.Country || '—'}</span>
            </div>
            <div class="meta-item">
              <strong>Premiações</strong>
              <span>${movie.Awards || '—'}</span>
            </div>
          </div>

          <!-- Botão de favorito no modal -->
          <button class="btn-fav-modal ${fav ? 'favoritado' : ''}" id="btn-fav-modal">
            ${fav ? '❤️ Remover dos favoritos' : '🤍 Adicionar aos favoritos'}
          </button>
        </div>
      </div>`;

    // Event listener no botão de favorito do modal
    $('btn-fav-modal').addEventListener('click', () => {
      const btn   = $('btn-fav-modal');
      const added = toggleFavorite({
        imdbID:     movie.imdbID,
        Title:      movie.Title,
        Year:       movie.Year,
        Poster:     movie.Poster,
        imdbRating: movie.imdbRating,
        Genre:      movie.Genre,
      });

      // Modifica classe e conteúdo do botão
      btn.className   = `btn-fav-modal ${added ? 'favoritado' : ''}`;
      btn.textContent = added
        ? '❤️ Remover dos favoritos'
        : '🤍 Adicionar aos favoritos';

      showToast(added
        ? `❤️ "${movie.Title}" adicionado!`
        : `💔 "${movie.Title}" removido.`
      );

      updateFavBadge();
      updateStats();

      // Sincroniza ícones em todos os grids visíveis
      document.querySelectorAll(`.btn-fav[data-id="${imdbID}"]`).forEach(b => {
        b.className   = `btn-fav ${added ? 'favoritado' : ''}`;
        b.textContent = added ? '❤️' : '🤍';
      });

      if (state.activeTab === 'favoritos') renderFavorites();
    });

  } catch (err) {
    // Mensagem de erro amigável dentro do modal
    modalContent.innerHTML = `
      <div class="error-msg" style="padding:3rem">
        <span>😕</span>
        <p>${err.message}</p>
        <small>Verifique sua conexão e tente novamente.</small>
      </div>`;
  }
}

/** Fecha o modal e restaura o scroll. */
function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════════════════════
   PAGINAÇÃO
═══════════════════════════════════════════════════════════ */

/** Atualiza os controles de paginação com base no estado atual. */
function updatePagination() {
  pagination.classList.remove('hidden');
  // Modificação do atributo 'disabled' conforme a página atual
  btnPrev.disabled          = state.currentPage <= 1;
  btnNext.disabled          = state.currentPage >= state.totalPages;
  // Template literal para o texto do indicador
  pageIndicator.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
}

/* ═══════════════════════════════════════════════════════════
   TABS DE NAVEGAÇÃO
═══════════════════════════════════════════════════════════ */

/**
 * Alterna entre as abas do site.
 * Manipula classes CSS para mostrar/ocultar cada seção.
 * @param {'catalogo'|'buscar'|'favoritos'} tab
 */
function switchTab(tab) {
  state.activeTab = tab;

  // querySelectorAll + forEach: atualiza a classe 'active' em todas as tabs
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab)
  );

  // classList.toggle com condição booleana para cada seção
  catalogSection.classList.toggle('hidden', tab !== 'catalogo');
  resultsSection.classList.toggle('hidden', tab !== 'buscar' || !state.currentQuery);
  favSection.classList.toggle('hidden', tab !== 'favoritos');

  if (tab === 'favoritos') renderFavorites();
}

/* ═══════════════════════════════════════════════════════════
   TEMA CLARO / ESCURO
═══════════════════════════════════════════════════════════ */

/** Alterna o tema e persiste a preferência no LocalStorage. */
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.body.classList.toggle('light', !isDark);
  btnToggle.textContent = isDark ? '☀️' : '🌙';
  saveTheme(isDark ? 'dark' : 'light');
}

/* ═══════════════════════════════════════════════════════════
   HISTÓRICO DE BUSCAS
═══════════════════════════════════════════════════════════ */

/** Renderiza chips clicáveis com as buscas recentes. */
function renderHistory() {
  const history    = getHistory();
  historyBar.innerHTML = '';
  if (!history.length) return;

  const label         = document.createElement('span');
  label.style.cssText = 'font-size:0.78rem;color:var(--muted);align-self:center';
  label.textContent   = 'Buscas recentes:';
  historyBar.appendChild(label);

  history.forEach(q => {
    const tag       = document.createElement('button');
    tag.className   = 'history-tag';
    tag.textContent = q;
    // Arrow function no event listener
    tag.addEventListener('click', () => {
      searchInput.value  = q;
      state.currentQuery = q;
      state.currentPage  = 1;
      switchTab('buscar');
      doSearch();
    });
    historyBar.appendChild(tag);
  });
}

/* ═══════════════════════════════════════════════════════════
   ESTATÍSTICAS
═══════════════════════════════════════════════════════════ */

/**
 * Atualiza painel de estatísticas lendo dados do LocalStorage.
 * - Total de favoritos
 * - Nota média dos favoritos
 * - Total de buscas realizadas na sessão
 */
function updateStats() {
  const favorites = getFavorites();
  statTotal.textContent    = favorites.length;
  statSearches.textContent = getSearchCount();

  // Calcula média apenas dos filmes com nota válida
  const ratings = favorites
    .map(f => parseFloat(f.imdbRating))
    .filter(r => !isNaN(r));

  statAvg.textContent = ratings.length
    ? (ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1)
    : '—';
}

/* ═══════════════════════════════════════════════════════════
   TOAST — Funcionalidade criativa extra (Bônus +1,0)
   Exibe uma notificação temporária no canto da tela.
═══════════════════════════════════════════════════════════ */
let toastTimeout;

/**
 * Exibe uma mensagem de toast por 2,5 segundos.
 * @param {string} msg - Texto da notificação
 */
function showToast(msg) {
  clearTimeout(toastTimeout);
  toast.textContent = msg;
  // Manipulação de classes para animar a entrada
  toast.classList.remove('hidden', 'toast-hide');
  toast.classList.add('toast-show');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */

/** Exibe ou oculta o spinner de loading dos resultados. */
const showLoading = show => loading.classList.toggle('hidden', !show);

/** Exibe ou oculta a mensagem de erro com texto personalizado. */
const showError = (show, msg = '') => {
  errorMsg.classList.toggle('hidden', !show);
  if (msg) errorText.textContent = msg;
};

/* ═══════════════════════════════════════════════════════════
   START
═══════════════════════════════════════════════════════════ */
init();