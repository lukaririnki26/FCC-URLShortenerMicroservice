require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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

// POST endpoint to create short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  try {
    const parsedUrl = new URL(originalUrl);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      const shortUrl = shortUrlCounter++;
      urlDatabase[shortUrl] = originalUrl;

      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    });

  } catch (err) {
    return res.json({ error: 'invalid url' });
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
