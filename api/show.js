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
    const showId = req.query.id || req.params.id;
    
    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

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

    res.json({ show, seasons });
  } catch (error) {
    console.error('Show details error:', error);
    res.status(500).json({ error: 'Error loading show details' });
  }
};
