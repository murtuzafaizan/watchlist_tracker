const express = require('express');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMDb API configuration
const IMDB_BASE_URL = 'https://imdb.iamidiotareyoutoo.com';

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Search API endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const response = await axios.get(`${IMDB_BASE_URL}/search`, {
      params: {
        q: query,
        v: 1
      }
    });

    const results = response.data.description || [];
    // Filter for TV series and movies, limit to 10 results
    const filteredResults = results.slice(0, 10).map(item => ({
      id: item['#IMDB_ID'],
      title: item['#TITLE'],
      year: item['#YEAR'],
      poster_path: item['#IMG_POSTER'],
      overview: item['#AKA'] || '',
      imdb_url: item['#IMDB_URL'],
      actors: item['#ACTORS'],
      rank: item['#RANK'],
      media_type: item['#TITLE'].toLowerCase().includes('series') || item['#TITLE'].toLowerCase().includes('tv') ? 'tv' : 'movie'
    }));

    res.json(filteredResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Get show details (mock data for Vercel deployment)
app.get('/show/:id', async (req, res) => {
  try {
    const showId = req.params.id;
    
    // Mock show data for Vercel deployment
    const show = {
      id: showId,
      tmdb_id: showId,
      title: 'TV Show',
      overview: 'TV show information - Database not available on Vercel',
      poster_path: '',
      backdrop_path: '',
      release_date: new Date().toISOString().split('T')[0],
      type: 'tv'
    };

    // Mock seasons
    const seasons = [
      {
        season_number: 1,
        name: 'Season 1',
        overview: 'First season of the show',
        poster_path: show.poster_path,
        air_date: show.release_date,
        episode_count: 10
      }
    ];

    // Return HTML for show page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${show.title} - Watch Tracking</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-900 text-white min-h-screen">
        <div class="container mx-auto px-4 py-8">
          <header class="mb-8">
            <a href="/" class="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6">
              <i class="fas fa-arrow-left mr-2"></i> Back to Search
            </a>
            
            <div class="flex flex-col md:flex-row gap-8 items-start">
              <div class="flex-shrink-0">
                <img src="${show.poster_path || 'https://via.placeholder.com/500x750/374151/ffffff?text=No+Image'}" 
                     alt="${show.title}" 
                     class="w-48 h-72 object-cover rounded-lg shadow-2xl">
              </div>
              
              <div class="flex-1">
                <h1 class="text-4xl font-bold mb-4">${show.title}</h1>
                <p class="text-gray-300 mb-6 text-lg leading-relaxed">${show.overview}</p>
                
                <div class="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
                  <p class="text-yellow-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <strong>Note:</strong> Database features are not available on Vercel. 
                    For full functionality, run this application locally with MySQL.
                  </p>
                </div>
                
                <div class="flex flex-wrap gap-4 text-sm">
                  <div class="bg-gray-800 px-4 py-2 rounded-lg">
                    <i class="fas fa-tv mr-2 text-blue-400"></i>
                    TV Show
                  </div>
                  <div class="bg-gray-800 px-4 py-2 rounded-lg">
                    <i class="fas fa-list mr-2 text-blue-400"></i>
                    ${seasons.length} Seasons
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main>
            <h2 class="text-3xl font-bold mb-8">Seasons</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              ${seasons.map(season => `
                <div class="bg-gray-800 rounded-lg overflow-hidden">
                  <div class="relative">
                    <img src="${season.poster_path || 'https://via.placeholder.com/500x281/374151/ffffff?text=No+Image'}" 
                         alt="${season.name}" 
                         class="w-full h-48 object-cover">
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h3 class="font-bold text-lg">${season.name}</h3>
                    </div>
                  </div>
                  <div class="p-4">
                    <div class="flex justify-between items-center mb-3">
                      <span class="text-gray-400">Season ${season.season_number}</span>
                      <span class="bg-blue-600 px-2 py-1 rounded text-sm">
                        ${season.episode_count} Episodes
                      </span>
                    </div>
                    <p class="text-gray-400 text-sm mb-3">
                      <i class="fas fa-calendar mr-1"></i>
                      ${new Date(season.air_date).toLocaleDateString()}
                    </p>
                    <p class="text-gray-300 text-sm">${season.overview}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </main>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Show details error:', error);
    res.status(500).send('Error loading show details');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Watch tracking API is running on Vercel' });
});

// Export for Vercel
module.exports = app;
