const express = require('express');
const fetch = require('node-fetch');
const RSSParser = require('rss-parser');
const path = require('path');

const app = express();
const parser = new RSSParser();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/fetch', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const response = await fetch(url, { timeout: 9000 });
    const text = await response.text();
    res.set('Content-Type', 'text/plain');
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
});

app.get('/api/rss', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, 20).map(item => ({
      title: item.title || 'Untitled',
      link: item.link || item.enclosure?.url || '#',
      description: item.contentSnippet || item.content || item.summary || '',
      pubDate: item.isoDate || item.pubDate || '',
      source: feed.title || '',
      image: item.enclosure?.url || item['media:content']?.url || ''
    }));
    res.json({ title: feed.title, description: feed.description, items });
  } catch (err) {
    res.status(500).json({ error: 'RSS parse failed', details: err.message });
  }
});

app.get('/api/source-search', async (req, res) => {
  const { query } = req.query;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Missing query' });
  }

  const feedlyUrl = `https://cloud.feedly.com/v3/search/feeds?q=${encodeURIComponent(query)}&n=30`;
  try {
    const feedlyResp = await fetch(feedlyUrl, { timeout: 9000 });
    if (!feedlyResp.ok) {
      throw new Error(`Feedly search failed ${feedlyResp.status}`);
    }
    const json = await feedlyResp.json();
    const suggestions = (json.results || []).slice(0, 20).map(item => {
      const feedUrl = (item.feedId || '').replace(/^feed\//, '');
      return {
        name: item.title || feedUrl || query,
        url: feedUrl,
        type: 'rss',
        country: item.language || 'Unknown',
        subscribers: item.subscribers || 0,
        velocity: item.velocity || 0
      };
    }).filter(item => item.url);
    return res.json({ items: suggestions });
  } catch (err) {
    console.warn('Feedly search fallback', err.message);
    // fallback: simple duckduckgo query via server
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' rss feed')}&format=json&no_html=1&skip_disambig=1`;
      const ddgResp = await fetch(ddgUrl, { timeout: 9000 });
      const ddg = await ddgResp.json();
      const topics = (ddg.RelatedTopics || []).flatMap(t => t.Topics ? t.Topics : [t]);
      const suggestions = topics.slice(0, 20).map(item => ({
        name: item.Text || item.FirstURL || query,
        url: item.FirstURL || '',
        type: 'rss',
        country: 'Unknown'
      })).filter(item => item.url);
      return res.json({ items: suggestions });
    } catch (fallbackErr) {
      return res.status(500).json({ error: 'Source search failed', details: fallbackErr.message });
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
