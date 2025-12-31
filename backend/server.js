const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./articles.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create table
db.run(`CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT,
  url TEXT UNIQUE,
  original_content TEXT,
  updated_content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Scrape function
async function scrapeArticles() {
  try {
    // First, find the last page
    const response = await axios.get('https://beyondchats.com/blogs/');
    const $ = cheerio.load(response.data);
    
    // Find pagination
    let lastPage = 1;
    $('.pagination a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const match = href.match(/\/blogs\/page\/(\d+)/);
        if (match) {
          const page = parseInt(match[1]);
          if (page > lastPage) lastPage = page;
        }
      }
    });

    console.log('Last page:', lastPage);

    // Scrape the last page
    const lastPageUrl = lastPage === 1 ? 'https://beyondchats.com/blogs/' : `https://beyondchats.com/blogs/page/${lastPage}/`;
    const pageResponse = await axios.get(lastPageUrl);
    const $page = cheerio.load(pageResponse.data);

    // Get the first 5 articles (oldest on last page)
    const articles = [];
    $page('.post-item, .blog-post, article').slice(0, 5).each((i, el) => {
      const title = $page(el).find('h2, .title').text().trim();
      const url = $page(el).find('a').attr('href');
      if (title && url) {
        articles.push({ title, url });
      }
    });

    // Scrape content for each article
    for (const article of articles) {
      try {
        const contentResponse = await axios.get(article.url);
        const $content = cheerio.load(contentResponse.data);
        const content = $content('.entry-content, .post-content, article .content').text().trim();
        article.content = content;
      } catch (error) {
        console.error('Error scraping content for', article.url, error.message);
        article.content = '';
      }
    }

    // Store in database
    for (const article of articles) {
      db.run(`INSERT OR IGNORE INTO articles (title, content, url, original_content) VALUES (?, ?, ?, ?)`,
        [article.title, article.content, article.url, article.content], function(err) {
          if (err) {
            console.error(err.message);
          } else {
            console.log('Inserted article:', article.title);
          }
        });
    }

  } catch (error) {
    console.error('Error scraping:', error.message);
  }
}

// Routes
app.get('/api/articles', (req, res) => {
  db.all('SELECT * FROM articles ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/articles/:id', (req, res) => {
  db.get('SELECT * FROM articles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

app.post('/api/articles', (req, res) => {
  const { title, content, url, updated_content } = req.body;
  db.run(`INSERT INTO articles (title, content, url, original_content, updated_content) VALUES (?, ?, ?, ?, ?)`,
    [title, content, url, content, updated_content], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    });
});

app.put('/api/articles/:id', (req, res) => {
  const { title, content, updated_content } = req.body;
  db.run(`UPDATE articles SET title = ?, content = ?, updated_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, content, updated_content, req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ changes: this.changes });
    });
});

app.delete('/api/articles/:id', (req, res) => {
  db.run('DELETE FROM articles WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

// Scrape on startup
scrapeArticles();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});