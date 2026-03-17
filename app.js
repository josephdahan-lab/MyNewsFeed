const STORAGE_KEY = 'newsHarvesterSources';
const DEFAULT_SOURCES = [];
const POPULAR_SOURCES = [
  { name: 'BBC News', country: 'UK', url: 'http://feeds.bbci.co.uk/news/rss.xml', type: 'rss' },
  { name: 'The Verge', country: 'USA', url: 'https://www.theverge.com/rss/index.xml', type: 'rss' },
  { name: 'CNN', country: 'USA', url: 'http://rss.cnn.com/rss/edition.rss', type: 'rss' },
  { name: 'Reuters', country: 'International', url: 'http://feeds.reuters.com/reuters/topNews', type: 'rss' },
  { name: 'TechCrunch', country: 'USA', url: 'http://feeds.feedburner.com/TechCrunch/', type: 'rss' },
  { name: 'NYTimes World', country: 'USA', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', type: 'rss' },
  { name: 'The Guardian (world)', country: 'UK', url: 'https://www.theguardian.com/world/rss', type: 'rss' },
  { name: 'Al Jazeera English', country: 'International', url: 'https://www.aljazeera.com/xml/rss/all.xml', type: 'rss' },
  { name: 'Euronews', country: 'International', url: 'https://www.euronews.com/rss?level=theme&name=news', type: 'rss' },
  { name: 'Deutsche Welle', country: 'Germany', url: 'https://rss.dw.com/rdf/rss-en-all', type: 'rss' },
  { name: 'El País (España)', country: 'Spain', url: 'https://elpais.com/rss/elpais/portada.xml', type: 'rss' },
  { name: 'La Repubblica', country: 'Italy', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml', type: 'rss' },
  { name: 'NHK World Japan', country: 'Japan', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', type: 'rss' },
  { name: 'Le Monde', country: 'France', url: 'https://www.lemonde.fr/mrss/une.xml', type: 'rss' },
  { name: 'Le Figaro', country: 'France', url: 'http://www.lefigaro.fr/rss/figaro_actualites.xml', type: 'rss' },
  { name: 'France 24 (FR)', country: 'France', url: 'https://www.france24.com/fr/rss', type: 'rss' },
  { name: '20 Minutes', country: 'France', url: 'https://www.20minutes.fr/rss/actu-france.xml', type: 'rss' },
  { name: 'RMC', country: 'France', url: 'https://rmc.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites', type: 'rss' },
  { name: 'Médiapart', country: 'France', url: 'https://www.mediapart.fr/journal/rss', type: 'rss' },
  { name: 'Libération', country: 'France', url: 'https://www.liberation.fr/rss', type: 'rss' },
  { name: 'BFMTV', country: 'France', url: 'https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites', type: 'rss' },
  { name: 'Feedly Discover', country: 'International', url: 'https://feedly.com/i/discover', type: 'html' }
];
const FALLBACK_NEWS = [
  { title: 'Sample: Global markets open higher after positive economic data', link: '#', description: 'Top story from a popular source: stocks climb as investors digest macro reports.', source: 'Sample', pubDate: new Date().toISOString() },
  { title: 'Sample: New AI model launches with dramatic improvements', link: '#', description: 'Tech update: AI advances in practical tasks and robotics integration.', source: 'Sample', pubDate: new Date(Date.now()-3600000).toISOString() },
  { title: 'Sample: Major company announces green energy initiative', link: '#', description: 'Environment story: sustainability plan backed by new investment.', source: 'Sample', pubDate: new Date(Date.now()-7200000).toISOString() }
];

const RECENT_HOST_SUGGESTIONS = [
  { name: 'Medium', url: 'https://medium.com', country: 'USA', type: 'rss' },
  { name: 'The Guardian', url: 'https://www.theguardian.com', country: 'UK', type: 'rss' },
  { name: 'Le Monde', url: 'https://www.lemonde.fr', country: 'France', type: 'rss' },
  { name: 'El País', url: 'https://elpais.com', country: 'Spain', type: 'rss' },
  { name: 'Der Spiegel', url: 'https://www.spiegel.de', country: 'Germany', type: 'rss' }
];

const state = {
  sources: [],
  editingId: null,
  news: [],
  newsBySource: {},
  filter: '',
  sourceFilter: '',
  sourceCountry: 'All',
  sourceSort: 'name',
  onlineSuggestions: [],
  newsFetchErrors: []
};
let onlineSearchTimer = null;


const elements = {
  newsTab: document.getElementById('tab-news'),
  sourcesTab: document.getElementById('tab-sources'),
  newsView: document.getElementById('news-view'),
  sourcesView: document.getElementById('sources-view'),
  searchInput: document.getElementById('search-input'),
  refreshBtn: document.getElementById('refresh-btn'),
  newsList: document.getElementById('news-list'),
  sourceForm: document.getElementById('source-form'),
  sourceName: document.getElementById('source-name'),
  sourceUrl: document.getElementById('source-url'),
  sourceType: document.getElementById('source-type'),
  sourceFilter: document.getElementById('source-filter'),
  sourceCountry: document.getElementById('source-country'),
  sourceSort: document.getElementById('source-sort'),
  sourceList: document.getElementById('source-list'),
  noSources: document.getElementById('no-sources'),
  cancelEdit: document.getElementById('cancel-edit'),
  exportSourcesBtn: document.getElementById('export-sources'),
  importSourcesTrigger: document.getElementById('import-sources-trigger'),
  importSourcesFile: document.getElementById('import-sources-file')
};

function loadSources() {
  const raw = localStorage.getItem(STORAGE_KEY);
  state.sources = raw ? JSON.parse(raw) : [...DEFAULT_SOURCES];
  if (!raw) saveSources();
}

function saveSources() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sources));
}

function setTab(tab) {
  elements.newsTab.classList.toggle('active', tab === 'news');
  elements.sourcesTab.classList.toggle('active', tab === 'sources');
  elements.newsView.classList.toggle('hidden', tab !== 'news');
  elements.sourcesView.classList.toggle('hidden', tab !== 'sources');
}

function renderSources() {
  elements.sourceList.innerHTML = '';
  elements.noSources.classList.toggle('hidden', state.sources.length > 0);

  const hint = document.createElement('p');
  hint.className = 'muted';
  hint.textContent = 'Popular source options (click Add to include):';
  elements.sourceList.appendChild(hint);

  const filtered = POPULAR_SOURCES.filter((suggestion) => {
    if (state.sourceCountry !== 'All' && suggestion.country !== state.sourceCountry) return false;
    if (!state.sourceFilter) return true;
    const term = state.sourceFilter.toLowerCase();
    return suggestion.name.toLowerCase().includes(term) || suggestion.country.toLowerCase().includes(term) || suggestion.url.toLowerCase().includes(term);
  });

  const recentHeading = document.createElement('p');
  recentHeading.className = 'muted';
  recentHeading.textContent = 'Recent history (simulated) - auto-detect from URL:';
  elements.sourceList.appendChild(recentHeading);

  RECENT_HOST_SUGGESTIONS.forEach((suggestion) => {
    const alreadyAdded = state.sources.some(src => src.url.trim().toLowerCase().includes(new URL(suggestion.url).hostname));
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `<div>
      <strong>${escapeHtml(suggestion.name)}</strong> <span class="muted">(${escapeHtml(suggestion.country)} / ${escapeHtml(suggestion.type)})</span><br/>
      <small>${escapeHtml(suggestion.url)}</small>
    </div>
    <div class="actions">
      <button class="add-suggestion" ${alreadyAdded ? 'disabled' : ''}>${alreadyAdded ? 'Added' : 'Add from history'}</button>
    </div>`;
    li.querySelector('.add-suggestion').addEventListener('click', () => addFromHistory(suggestion));
    elements.sourceList.appendChild(li);
  });

  const sorted = filtered.sort((a, b) => {
    if (state.sourceSort === 'country') {
      return a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });

  sorted.forEach((suggestion) => {
    const alreadyAdded = state.sources.some(src => src.url.trim().toLowerCase() === suggestion.url.trim().toLowerCase());
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `<div>
      <strong>${escapeHtml(suggestion.name)}</strong> <span class="muted">(${escapeHtml(suggestion.country)} / ${escapeHtml(suggestion.type)})</span><br/>
      <small>${escapeHtml(suggestion.url)}</small>
    </div>
    <div class="actions">
      <button class="add-suggestion" ${alreadyAdded ? 'disabled' : ''}>${alreadyAdded ? 'Added' : 'Add'}</button>
    </div>`;
    li.querySelector('.add-suggestion').addEventListener('click', () => addSuggestedSource(suggestion));
    elements.sourceList.appendChild(li);
  });

  if (state.onlineSuggestions.length) {
    const heading3 = document.createElement('p');
    heading3.className = 'muted';
    heading3.textContent = 'Online source results:';
    elements.sourceList.appendChild(heading3);

    state.onlineSuggestions.forEach((suggestion) => {
      const alreadyAdded = state.sources.some(src => src.url.trim().toLowerCase() === suggestion.url.trim().toLowerCase());
      const li = document.createElement('li');
      li.className = 'item';
      li.innerHTML = `<div>
      <strong>${escapeHtml(suggestion.name)}</strong> <span class="muted">(${escapeHtml(suggestion.country || 'Unknown')} / ${escapeHtml(suggestion.type || 'rss')})</span><br/>
      <small>${escapeHtml(suggestion.url)}</small>
    </div>
    <div class="actions">
      <button class="add-suggestion" ${alreadyAdded ? 'disabled' : ''}>${alreadyAdded ? 'Added' : 'Add'}</button>
    </div>`;
      li.querySelector('.add-suggestion').addEventListener('click', () => addSuggestedSource({ ...suggestion, country: suggestion.country || 'Unknown', type: suggestion.type || 'rss' }));
      elements.sourceList.appendChild(li);
    });
  }

  if (state.sources.length) {
    const heading2 = document.createElement('p');
    heading2.className = 'muted';
    heading2.textContent = 'Your active sources:';
    elements.sourceList.appendChild(heading2);

    state.sources.forEach(src => {
      const isDisabled = src.disabled;
      const indicator = isDisabled ? ' (disabled)' : '';
      const li = document.createElement('li');
      li.className = isDisabled ? 'item disabled-source' : 'item';
      li.innerHTML = `
        <div>
          <strong>${escapeHtml(src.name)}</strong> <span class="muted">(${src.type})</span><span class="muted">${indicator}</span><br/>
          <small>${escapeHtml(src.url)}</small>
          ${src.failCount ? `<div class="muted">Attempts: ${src.failCount}</div>` : ''}
        </div>
        <div class="actions">
          <button class="edit" ${isDisabled ? 'disabled' : ''}>Edit</button>
          <button class="delete">Delete</button>
        </div>`;
      li.querySelector('.edit').addEventListener('click', () => startEditSource(src.id));
      li.querySelector('.delete').addEventListener('click', () => deleteSource(src.id));
      elements.sourceList.appendChild(li);
    });
  }
}

function startEditSource(id) {
  const src = state.sources.find(i => i.id === id);
  if (!src) return;
  state.editingId = id;
  elements.sourceName.value = src.name;
  elements.sourceUrl.value = src.url;
  elements.sourceType.value = src.type;
  elements.cancelEdit.classList.remove('hidden');
}

function cancelEdit() {
  state.editingId = null;
  elements.sourceForm.reset();
  elements.cancelEdit.classList.add('hidden');
}

function deleteSource(id) {
  if (!confirm('Delete this source?')) return;
  state.sources = state.sources.filter(s => s.id !== id);
  saveSources();
  renderSources();
  fetchAndRenderNews();
}

function addOrUpdateSource(event) {
  event.preventDefault();
  const name = elements.sourceName.value.trim();
  const url = elements.sourceUrl.value.trim();
  const type = elements.sourceType.value;
  if (!name || !url) return;

  if (state.editingId) {
    const idx = state.sources.findIndex(s => s.id === state.editingId);
    if (idx > -1) state.sources[idx] = { ...state.sources[idx], name, url, type, failCount: 0, disabled: false };
  } else {
    state.sources.push({ id: crypto.randomUUID?.() || Date.now().toString(), name, url, type, failCount: 0, disabled: false });
  }
  saveSources();
  renderSources();
  cancelEdit();
  setTab('news');
  fetchAndRenderNews();
}

function addSuggestedSource(suggestion) {
  const exists = state.sources.some(src => src.url.trim().toLowerCase() === suggestion.url.trim().toLowerCase());
  if (exists) return;

  state.sources.push({ id: crypto.randomUUID?.() || Date.now().toString(), name: suggestion.name, url: suggestion.url, type: suggestion.type, country: suggestion.country, failCount: 0, disabled: false });
  saveSources();
  renderSources();
  setTab('news');
  fetchAndRenderNews();
}

async function addFromHistory(suggestion) {
  const detected = await detectRssUrlFromPage(suggestion.url);
  if (!detected) {
    alert(`Could not detect RSS for ${suggestion.name}. Please add manually.`);
    return;
  }
  const exists = state.sources.some(src => src.url.trim().toLowerCase() === detected.trim().toLowerCase());
  if (exists) {
    alert(`Feed already added for ${suggestion.name}.`);
    return;
  }
  state.sources.push({ id: crypto.randomUUID?.() || Date.now().toString(), name: suggestion.name, url: detected, type: 'rss', country: suggestion.country, failCount: 0, disabled: false });
  saveSources();
  renderSources();
  setTab('news');
  fetchAndRenderNews();
  alert(`Added ${suggestion.name} RSS: ${detected}`);
}

function exportSources() {
  const data = JSON.stringify(state.sources, null, 2);
  const file = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'news-harvester-sources.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importSourcesFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const arr = JSON.parse(e.target.result);
      if (!Array.isArray(arr)) throw new Error('Expected array');
      const valid = arr.filter(item => item && item.name && item.url && item.type);
      if (!valid.length) throw new Error('No valid source entries');
      state.sources = valid.map(item => ({
        id: item.id || crypto.randomUUID?.() || Date.now().toString(),
        name: item.name,
        url: item.url,
        type: item.type,
        country: item.country || 'Unknown'
      }));
      saveSources();
      renderSources();
      fetchAndRenderNews();
      alert('Imported ' + state.sources.length + ' sources.');
    } catch (err) {
      alert('Import failed: ' + (err.message || err));
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}


function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]);
}

async function fetchAndRenderNews() {
  elements.newsList.innerHTML = '<li class="item">Loading news...</li>';
  state.newsBySource = {};
  const entries = [];

  state.newsFetchErrors = [];
  const feedPromises = state.sources.map(async (src) => {
    try {
      if (src.type === 'html') {
        const detectedUrl = await detectRssUrlFromPage(src.url);
        if (detectedUrl) {
          src.type = 'rss';
          src.url = detectedUrl;
          saveSources();
        }
      }

      if (src.type === 'rss') {
        let parsed;
        try {
          parsed = await fetchRss(src.url);
        } catch (firstErr) {
          // try alternate patterns or HTTPS fallback
          let fallbackDetected = null;
          if (src.url.startsWith('http://')) {
            fallbackDetected = src.url.replace('http://', 'https://');
          }
          if (!fallbackDetected) {
            fallbackDetected = await detectRssUrlFromPage(src.url);
          }
          if (fallbackDetected && fallbackDetected !== src.url) {
            try {
              parsed = await fetchRss(fallbackDetected);
              src.url = fallbackDetected;
              saveSources();
            } catch (secondErr) {
              throw secondErr;
            }
          } else {
            throw firstErr;
          }
        }

        if (!parsed || !parsed.length) {
          throw new Error('No feed items');
        }
        const items = parsed.map(item => ({ ...item, source: src.name })).sort((a, b) => (new Date(b.pubDate || b.date || 0) - new Date(a.pubDate || a.date || 0)));
        const topItems = items.slice(0, 5);
        state.newsBySource[src.name] = topItems;
        entries.push(...topItems);
      } else {
        const synthetic = { title: src.name, link: src.url, source: src.name, description: 'Website link (no RSS feed yet)' };
        state.newsBySource[src.name] = [synthetic];
        entries.push(synthetic);
      }
    } catch (err) {
      console.error('Fetch error', src.url, err);
      src.failCount = (src.failCount || 0) + 1;
      if (src.failCount >= 3) {
        src.disabled = true;
      }
      state.newsFetchErrors.push({ source: src.name, url: src.url, message: err.message });
      const failItem = { title: `Failed to fetch ${src.name}`, link: '#', source: src.name, description: err.message };
      state.newsBySource[src.name] = [failItem];
      entries.push(failItem);
    }
  });

  await Promise.all(feedPromises);

  if (entries.length === 0) {
    state.news = FALLBACK_NEWS;
    state.newsBySource = { Sample: [...FALLBACK_NEWS] };
  } else {
    state.news = entries.sort((a, b) => (new Date(b.pubDate || b.date || 0) - new Date(a.pubDate || a.date || 0)));
  }

  renderNewsList();
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 7000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

function resolveRelativeUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch (error) {
    return null;
  }
}

function retryFailedSources() {
  state.sources.forEach(src => {
    src.failCount = 0;
    src.disabled = false;
  });
  saveSources();
  renderSources();
  fetchAndRenderNews();
}

async function detectRssUrlFromPage(pageUrl) {
  try {
    const normalizedUrl = pageUrl.startsWith('http') ? pageUrl : 'http://' + pageUrl;
    const fetchUrl = `/api/fetch?url=${encodeURIComponent(normalizedUrl)}`;
    const text = await (await fetchWithTimeout(fetchUrl, { timeout: 7000 })).text();
    const dom = new DOMParser().parseFromString(text, 'text/html');
    const links = [...dom.querySelectorAll('link[rel~="alternate"]')];
    for (const link of links) {
      const type = (link.getAttribute('type') || '').toLowerCase();
      if (type.includes('rss') || type.includes('atom') || type.includes('xml')) {
        const href = link.getAttribute('href');
        const resolved = resolveRelativeUrl(normalizedUrl, href);
        if (resolved) return resolved;
      }
    }

    const base = new URL(normalizedUrl).origin;
    const attempts = [
      `${normalizedUrl}/rss`,
      `${normalizedUrl}/feed`,
      `${base}/rss`,
      `${base}/feed`,
      `${base}/rss.xml`,
      `${base}/feed.xml`
    ];

    for (const attempt of attempts) {
      try {
        const resp = await fetchWithTimeout(`/api/fetch?url=${encodeURIComponent(attempt)}`, { timeout: 7000 });
        if (resp.ok) {
          const content = await resp.text();
          if (content.includes('<rss') || content.includes('<feed')) {
            return attempt;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  } catch (err) {
    console.error('RSS detect error', err);
    return null;
  }
}

async function handleAutoDetectRss() {
  const url = elements.sourceUrl.value.trim();
  if (!url) {
    alert('Enter a URL to detect RSS.');
    return;
  }

  const statu = document.getElementById('detect-status');
  statu.textContent = 'Detecting RSS feed...';
  statu.classList.remove('muted');
  try {
    const rssUrl = await detectRssUrlFromPage(url);
    if (!rssUrl) {
      statu.textContent = 'No RSS feed found automatically.';
      return;
    }
    elements.sourceUrl.value = rssUrl;
    elements.sourceType.value = 'rss';
    if (!elements.sourceName.value.trim()) {
      const hostname = new URL(url.startsWith('http') ? url : 'http://' + url).hostname;
      elements.sourceName.value = hostname;
    }
    statu.textContent = `Detected RSS URL: ${rssUrl}`;
    statu.classList.add('muted');
  } catch (err) {
    statu.textContent = 'RSS detection failed.';
    console.error(err);
  }
}

async function searchOnlineSources(term) {
  if (!term || term.trim().length < 2) {
    state.onlineSuggestions = [];
    renderSources();
    return;
  }

  clearTimeout(onlineSearchTimer);
  onlineSearchTimer = setTimeout(async () => {
    try {
      const serviceUrl = `/api/source-search?query=${encodeURIComponent(term)}`;
      const response = await fetchWithTimeout(serviceUrl, { timeout: 9000 });
      if (!response.ok) {
        throw new Error(`Source search API failed ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data.items)) {
        throw new Error('Unexpected source search payload');
      }
      state.onlineSuggestions = data.items.slice(0, 20).map(item => ({
        name: item.name || item.url,
        url: item.url,
        type: 'rss',
        country: item.country || 'Unknown'
      }));
      renderSources();
    } catch (err) {
      console.error('Online source lookup failed', err);
      try {
        // fallback to direct client-side DuckDuckGo service if Feedly endpoint fails
        const query = `${encodeURIComponent(term)}+rss+news`;
        const ddgUrl = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`;
        const apiUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(ddgUrl)}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Fallback search failed ${res.status}`);
        const json = await res.json();
        const topics = (json.RelatedTopics || []).flatMap(t => t.Topics ? t.Topics : [t]);
        state.onlineSuggestions = topics.slice(0, 12).map(item => ({
          name: item.Text || item.FirstURL || term,
          url: item.FirstURL || '',
          type: 'rss',
          country: 'Unknown'
        })).filter(s => s.url);
      } catch (fallbackErr) {
        console.error('Secondary fallback search failed', fallbackErr);
        state.onlineSuggestions = [];
      }
      renderSources();
    }
  }, 350);
}

async function fetchRss(feedUrl) {
  const url = `/api/rss?url=${encodeURIComponent(feedUrl)}`;
  const response = await fetchWithTimeout(url, { timeout: 12000 });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error || `RSS fetch failed ${response.status}`);
  }
  const data = await response.json();
  return (data.items || []).slice(0, 10);
}

function renderNewsList() {
  const search = state.filter.trim().toLowerCase();
  const sourceNames = Object.keys(state.newsBySource);

  const errorBox = document.getElementById('news-error-box');
  if (state.newsFetchErrors.length) {
    const messages = state.newsFetchErrors.map(err => `${err.source}: ${err.message}`).join('<br/>');
    errorBox.innerHTML = `Some sources failed to load:<br/>${messages}`;
    errorBox.classList.remove('hidden');
  } else {
    errorBox.classList.add('hidden');
  }

  if (sourceNames.length === 0) {
    elements.newsList.innerHTML = '<li class="item">No news items found.</li>';
    return;
  }

  const tiles = [];

  sourceNames.sort().forEach(sourceName => {
    const items = (state.newsBySource[sourceName] || []).filter(e =>
      !search ||
      e.title.toLowerCase().includes(search) ||
      (e.source || '').toLowerCase().includes(search) ||
      (e.description || '').toLowerCase().includes(search)
    );

    if (!items.length) return;

    const top = items[0];
    tiles.push({ sourceName, item: top });
  });

  if (tiles.length === 0) {
    elements.newsList.innerHTML = '<li class="item">No news items found.</li>';
    return;
  }

  elements.newsList.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'tile-grid';

  tiles.forEach(obj => {
    const { sourceName, item } = obj;
    const imageSrc = item.image || item.thumbnail || `https://source.unsplash.com/400x260/?${encodeURIComponent(sourceName)},news`;

    const card = document.createElement('article');
    card.className = 'tile';
    card.innerHTML = `<a href="${escapeHtml(item.link || '#')}" target="_blank" rel="noopener noreferrer">
      <div class="tile-image-wrap"><img class="tile-image" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.title || sourceName)}" onerror="this.src='https://via.placeholder.com/400x260?text=No+Image';" /></div>
      <div class="tile-label"><strong>${escapeHtml(sourceName)}</strong><p>${escapeHtml(item.title || '')}</p></div>
    </a>`;
    grid.appendChild(card);
  });

  elements.newsList.appendChild(grid);
}

function wireEvents() {
  elements.newsTab.addEventListener('click', () => setTab('news'));
  elements.sourcesTab.addEventListener('click', () => setTab('sources'));
  elements.refreshBtn.addEventListener('click', fetchAndRenderNews);
  document.getElementById('retry-failed').addEventListener('click', retryFailedSources);
  elements.searchInput.addEventListener('input', e => { state.filter = e.target.value; renderNewsList(); });
  elements.sourceFilter.addEventListener('input', e => {
    state.sourceFilter = e.target.value;
    renderSources();
    searchOnlineSources(state.sourceFilter);
  });
  elements.sourceCountry.addEventListener('change', e => { state.sourceCountry = e.target.value; renderSources(); });
  elements.sourceSort.addEventListener('change', e => { state.sourceSort = e.target.value; renderSources(); });
  elements.exportSourcesBtn.addEventListener('click', exportSources);
  elements.importSourcesTrigger.addEventListener('click', () => elements.importSourcesFile.click());
  elements.importSourcesFile.addEventListener('change', importSourcesFromFile);
  document.getElementById('detect-rss').addEventListener('click', handleAutoDetectRss);
  elements.sourceForm.addEventListener('submit', addOrUpdateSource);
  elements.cancelEdit.addEventListener('click', cancelEdit);
}

function init() {
  loadSources();
  wireEvents();
  renderSources();
  fetchAndRenderNews();
  const hint = document.createElement('p');
  hint.className = 'muted';
  hint.innerHTML = 'Tip: Use the filter in sources pane to dynamically search, and import/export JSON for backup.';
  elements.sourcesView.insertBefore(hint, elements.sourceList);
}

init();
