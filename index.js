require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

// In-memory storage for URLs
let urlDatabase = {};
let shortUrlCounter = 1;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST create short URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    const parsedUrl = new URL(originalUrl);

    // only allow http / https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.json({ error: 'invalid url' });
    }

    // Verify hostname with DNS lookup
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      const shortUrl = shortUrlCounter++;
      urlDatabase[shortUrl.toString()] = originalUrl;

      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    });

  } catch {
    res.json({ error: 'invalid url' });
  }
});

// GET redirect
app.get('/api/shorturl/:short_url', (req, res) => {
  const originalUrl = urlDatabase[req.params.short_url];

  if (!originalUrl) {
    return res.json({ error: 'Short URL not found' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
