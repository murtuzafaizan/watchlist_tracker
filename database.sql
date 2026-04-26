-- Database schema for watch tracking application

CREATE DATABASE IF NOT EXISTS watch_tracking;
USE watch_tracking;

-- Shows table
CREATE TABLE shows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tmdb_id INT UNIQUE,
    title VARCHAR(255) NOT NULL,
    overview TEXT,
    poster_path VARCHAR(255),
    backdrop_path VARCHAR(255),
    release_date DATE,
    type ENUM('tv', 'movie') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seasons table (for TV shows)
CREATE TABLE seasons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    show_id INT NOT NULL,
    season_number INT NOT NULL,
    tmdb_id INT,
    name VARCHAR(255),
    overview TEXT,
    poster_path VARCHAR(255),
    air_date DATE,
    episode_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    UNIQUE KEY unique_season (show_id, season_number)
);

-- Episodes table
CREATE TABLE episodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    show_id INT NOT NULL,
    season_id INT NOT NULL,
    episode_number INT NOT NULL,
    tmdb_id INT,
    name VARCHAR(255) NOT NULL,
    overview TEXT,
    still_path VARCHAR(255),
    air_date DATE,
    runtime INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_episode (show_id, season_id, episode_number)
);

-- Watch history table
CREATE TABLE watch_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) DEFAULT 'default_user',
    episode_id INT NOT NULL,
    watched_minutes INT DEFAULT 0,
    total_minutes INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_episode (user_id, episode_id)
);

-- Insert sample data (optional)
-- INSERT INTO shows (tmdb_id, title, overview, type) VALUES 
-- (1396, "Breaking Bad", "A high school chemistry teacher...", "tv"),
-- (238, "The Shawshank Redemption", "Two imprisoned men bond...", "movie");
