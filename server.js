require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'watch_tracking'
};

let db;

async function initDatabase() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// IMDb API configuration
const IMDB_BASE_URL = 'https://imdb.iamidiotareyoutoo.com';

// Routes
app.get('/', (req, res) => {
    res.render('index');
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

// Get show details
app.get('/show/:id', async (req, res) => {
    try {
        const showId = req.params.id;
        
        // First check if show exists in our database
        const [showRows] = await db.execute(
            'SELECT * FROM shows WHERE tmdb_id = ?',
            [showId]
        );

        let show;
        if (showRows.length === 0) {
            // For IMDb API, we'll create a basic show entry
            // In a real implementation, you might want to scrape more details
            show = {
                id: showId,
                tmdb_id: showId,
                title: 'TV Show', // Will be updated from search results
                overview: 'TV show information',
                poster_path: '',
                backdrop_path: '',
                release_date: new Date().toISOString().split('T')[0],
                type: 'tv'
            };
            
            // Save show to database
            await db.execute(`
                INSERT INTO shows (tmdb_id, title, overview, poster_path, backdrop_path, release_date, type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                show.tmdb_id,
                show.title,
                show.overview,
                show.poster_path,
                show.backdrop_path,
                show.release_date,
                show.type
            ]);
        } else {
            show = showRows[0];
        }

        // Since IMDb API doesn't provide season info, we'll create mock data
        // In a real implementation, you'd need to scrape this data
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

        res.render('show', { show, seasons });
    } catch (error) {
        console.error('Show details error:', error);
        res.status(500).send('Error loading show details');
    }
});

// Get season details with episodes
app.get('/show/:showId/season/:seasonNumber', async (req, res) => {
    try {
        const { showId, seasonNumber } = req.params;
        
        // Get show details
        const [showRows] = await db.execute(
            'SELECT * FROM shows WHERE tmdb_id = ?',
            [showId]
        );
        
        if (showRows.length === 0) {
            return res.status(404).send('Show not found');
        }

        const show = showRows[0];

        // Since IMDb API doesn't provide episode data, we'll create mock episodes
        const season = {
            season_number: parseInt(seasonNumber),
            name: `Season ${seasonNumber}`,
            overview: `Season ${seasonNumber} of ${show.title}`,
            poster_path: show.poster_path,
            air_date: show.release_date,
            episode_count: 10
        };

        // Create mock episodes
        const episodes = [];
        for (let i = 1; i <= 10; i++) {
            episodes.push({
                id: `${showId}_S${seasonNumber}E${i}`,
                episode_number: i,
                name: `Episode ${i}`,
                overview: `Episode ${i} of Season ${seasonNumber}`,
                still_path: show.poster_path,
                air_date: show.release_date,
                runtime: 45,
                season_number: parseInt(seasonNumber)
            });
        }

        res.render('season', { show, season, episodes });
    } catch (error) {
        console.error('Season details error:', error);
        res.status(500).send('Error loading season details');
    }
});

// Get episode details with watch progress
app.get('/show/:showId/season/:seasonNumber/episode/:episodeNumber', async (req, res) => {
    try {
        const { showId, seasonNumber, episodeNumber } = req.params;
        
        // Get show details
        const [showRows] = await db.execute(
            'SELECT * FROM shows WHERE tmdb_id = ?',
            [showId]
        );
        
        if (showRows.length === 0) {
            return res.status(404).send('Show not found');
        }

        const show = showRows[0];

        // Create mock episode data
        const episode = {
            id: `${showId}_S${seasonNumber}E${episodeNumber}`,
            episode_number: parseInt(episodeNumber),
            name: `Episode ${episodeNumber}`,
            overview: `Episode ${episodeNumber} of Season ${seasonNumber}`,
            still_path: show.poster_path,
            air_date: show.release_date,
            runtime: 45,
            season_number: parseInt(seasonNumber)
        };

        // Get watch progress for this episode
        const [watchRows] = await db.execute(`
            SELECT * FROM watch_history 
            WHERE user_id = ? AND episode_id = ?
        `, ['default_user', episode.id]);

        const watchProgress = watchRows.length > 0 ? watchRows[0] : {
            watched_minutes: 0,
            total_minutes: episode.runtime || 0,
            is_completed: false
        };

        res.render('episode', { show, episode, watchProgress });
    } catch (error) {
        console.error('Episode details error:', error);
        res.status(500).send('Error loading episode details');
    }
});

// Update watch progress
app.post('/api/watch-progress', async (req, res) => {
    try {
        const { episodeId, watchedMinutes, isCompleted } = req.body;
        
        // For IMDb API, we'll use a default runtime of 45 minutes
        const totalMinutes = 45;

        await db.execute(`
            INSERT INTO watch_history (user_id, episode_id, watched_minutes, total_minutes, is_completed)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            watched_minutes = VALUES(watched_minutes),
            total_minutes = VALUES(total_minutes),
            is_completed = VALUES(is_completed),
            last_watched_at = CURRENT_TIMESTAMP
        `, ['default_user', episodeId, watchedMinutes, totalMinutes, isCompleted]);

        res.json({ success: true });
    } catch (error) {
        console.error('Watch progress update error:', error);
        res.status(500).json({ error: 'Failed to update watch progress' });
    }
});

// Start server
async function startServer() {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();

module.exports = app;
