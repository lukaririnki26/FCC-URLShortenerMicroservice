require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const fs = require('fs');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

// Load or initialize database
const dbFile = '/tmp/urls.json';
let urlDatabase = {};
let shortUrlCounter = 1;

try {
  if (fs.existsSync(dbFile)) {
    const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    urlDatabase = data.urls;
    shortUrlCounter = data.counter;
  }
} catch (err) {
  console.log('Starting with fresh database');
}

// Save database to file
function saveDatabase() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify({
      urls: urlDatabase,
      counter: shortUrlCounter
    }));
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST endpoint to create short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  // Validate URL format
  try {
    const parsedUrl = new URL(originalUrl);
    
    // Check if it's http or https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    // Verify hostname with DNS lookup
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Create short URL
      const shortUrl = shortUrlCounter++;
      urlDatabase[shortUrl.toString()] = originalUrl;
      saveDatabase();

      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    });
  } catch (err) {
    res.json({ error: 'invalid url' });
  }
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (!originalUrl) {
    return res.json({ error: 'Short URL not found' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
