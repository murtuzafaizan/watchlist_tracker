const axios = require('axios');

// IMDb API configuration
const IMDB_BASE_URL = 'https://imdb.iamidiotareyoutoo.com';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
};
