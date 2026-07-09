# 🎬 CineScope — Catálogo de Filmes

Aplicação web interativa para busca, exploração e gerenciamento de filmes favoritos, desenvolvida como Trabalho 3 da disciplina de Desenvolvimento de Software — UFRB 2026.

---

## 👥 Equipe

| Nome | Matrícula |
|------|-----------|
| Anabela França | — |
| Levy Cálide | — |

---

## 📁 Estrutura de Arquivos

```
TRABALHO 3/
├── .vscode/
├── css/
│   └── style.css           # Estilos da aplicação
├── js/
│   ├── api.js              # Funções de consumo da OMDb API
│   ├── app.js              # Controlador principal e manipulação do DOM
│   └── storage.js          # Funções de persistência com LocalStorage
├── index.html              # Página principal da aplicação
├── launch.json
└── README.md
```

---

## 🛠️ Tecnologias Utilizadas

- **HTML5** — estrutura semântica
- **CSS3** — Flexbox, Grid, variáveis CSS, dark mode, animações
- **JavaScript ES6+** — módulos, arrow functions, template literals, async/await
- **Fetch API** — consumo da API externa
- **LocalStorage** — persistência de dados no navegador
- **OMDb API** — base de dados de filmes ([omdbapi.com](https://www.omdbapi.com/))
- **Chart.js** — biblioteca externa para gráficos (bônus)

---

## ✅ Funcionalidades Implementadas

### Obrigatórias
- Busca de filmes por título via OMDb API
- Exibição de resultados em grid responsivo
- Detalhes ao clicar no filme: poster, sinopse, nota IMDb, elenco, diretor, duração e premiações
- Adição e remoção de favoritos com persistência em LocalStorage
- Aba de favoritos separada
- Filtro por gênero (nos resultados de busca e nos favoritos)
- Paginação dos resultados
- Loading spinner durante requisições
- Mensagens de erro amigáveis

### Extras / Bônus
- **Catálogo inicial** com os 20 melhores filmes do IMDb carregados automaticamente
- **Toast de feedback** — notificação ao favoritar ou remover um filme (+1,0)
- **Gráfico de notas** dos favoritos com Chart.js (+0,5)
- **Histórico de buscas** clicável, salvo no LocalStorage
- **Estatísticas** em tempo real: total de favoritos, nota média e buscas realizadas
- **Dark mode** com alternância e preferência salva
- **Event delegation** nos grids de filmes
- **Promise.all** para carregamento paralelo do catálogo

---

## 📋 Requisitos Técnicos Atendidos

### Manipulação do DOM
- `querySelector` / `querySelectorAll`
- Criação dinâmica de elementos com `createElement` e `innerHTML`
- Modificação de conteúdo, atributos e classes CSS

### Eventos
- `submit`, `click`, `input`, `change`, `keydown`
- Event delegation nos grids
- `e.preventDefault()` no formulário de busca

### API e Assincronicidade
- Fetch API com `async/await`
- `Promise.all` para requisições paralelas
- Tratamento de erros com `try/catch/finally`
- Loading states visuais

### Armazenamento
- `localStorage.setItem` / `getItem`
- `JSON.stringify()` / `JSON.parse()`
- Gerenciamento de estado centralizado

### Boas Práticas
- Código modular separado em arquivos por responsabilidade
- Nomes descritivos de variáveis e funções
- Comentários explicativos em funções complexas
- Uso de `const` / `let` (sem `var`)
- Arrow functions e template literals

---

## 📊 Critérios de Avaliação

| Critério | Pontos | Status |
|---|---|---|
| Funcionalidades obrigatórias | 5,0 | ✅ Todas implementadas |
| Qualidade do JavaScript | 4,0 | ✅ Código limpo e modular |
| Uso de API | 3,0 | ✅ OMDb com tratamento de erros |
| Interface e UX | 2,0 | ✅ Responsiva e intuitiva |
| Persistência de dados | 1,0 | ✅ LocalStorage funcional |
| Trabalho em equipe | 1,0 | ✅ Git com contribuições |
| **Bônus: funcionalidade criativa** | +1,0 | ✅ Toast de feedback |
| **Bônus: biblioteca externa** | +0,5 | ✅ Chart.js |
| **Bônus: documentação** | +0,5 | ✅ Código comentado |

---

*Trabalho 3 — Desenvolvimento de Software — UFRB 2026*