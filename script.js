// Telegram WebApp initialization
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.enableClosingConfirmation();
}

// Configuration
const PROXY_URL = 'https://api.allorigins.win/raw?url=';
const YOUTUBE_SEARCH = 'https://www.youtube.com/results?search_query=';

let currentVideo = null;
let adTimer = 5;
let adInterval = null;

// Local fallback videos (for testing)
const fallbackVideos = [
    {
        id: 'dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up',
        channel: 'Rick Astley',
        duration: '3:32',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'Official Music Video'
    },
    {
        id: 'kJQP7kiw5Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        channel: 'Luis Fonsi',
        duration: '4:41',
        youtubeId: 'kJQP7kiw5Fk',
        description: 'Official Music Video'
    },
    {
        id: '3JZ_D3ELwOQ',
        title: 'Ed Sheeran - Shape of You',
        channel: 'Ed Sheeran',
        duration: '4:24',
        youtubeId: '3JZ_D3ELwOQ',
        description: 'Official Music Video'
    },
    {
        id: '7wtfhZwyrcc',
        title: 'The Weeknd - Blinding Lights',
        channel: 'The Weeknd',
        duration: '3:20',
        youtubeId: '7wtfhZwyrcc',
        description: 'Official Video'
    },
    {
        id: 'OPf0YbXqDm0',
        title: 'Maroon 5 - Sugar',
        channel: 'Maroon 5',
        duration: '4:27',
        youtubeId: 'OPf0YbXqDm0',
        description: 'Official Music Video'
    },
    {
        id: 'kffacxfA7G4',
        title: 'Katy Perry - Roar',
        channel: 'Katy Perry',
        duration: '3:42',
        youtubeId: 'kffacxfA7G4',
        description: 'Official Video'
    }
];

// Load videos from YouTube
async function loadVideos(query = 'trending videos') {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading videos...</p></div>';
    
    try {
        // Try to fetch from YouTube via proxy
        const searchUrl = `${YOUTUBE_SEARCH}${encodeURIComponent(query)}`;
        const proxyUrl = `${PROXY_URL}${encodeURIComponent(searchUrl)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const html = await response.text();
        
        // Extract video data
        const videos = extractVideosFromHTML(html);
        
        if (videos && videos.length > 0) {
            displayVideos(videos);
        } else {
            // If extraction fails, show fallback videos
            displayVideos(fallbackVideos);
        }
    } catch (error) {
        console.log('Using fallback videos:', error);
        displayVideos(fallbackVideos);
    }
}

// Extract videos from YouTube HTML
function extractVideosFromHTML(html) {
    const videos = [];
    const videoRegex = /"videoId":"(.*?)".*?"title":{"runs":\[{"text":"(.*?)"}\].*?"lengthText":"(.*?)".*?"viewCountText":"(.*?)"/g;
    
    let match;
    let count = 0;
    
    while ((match = videoRegex.exec(html)) !== null && count < 20) {
        const videoId = match[1];
        const title = match[2];
        const duration = match[3] || '00:00';
        const views = match[4] || '';
        
        // Avoid duplicates
        if (!videos.find(v => v.id === videoId)) {
            videos.push({
                id: videoId,
                title: title,
                channel: 'YouTube',
                duration: formatDuration(duration),
                youtubeId: videoId,
                views: views,
                description: title
            });
            count++;
        }
    }
    
    return videos;
}

// Format duration
function formatDuration(duration) {
    // Simple formatter - you can improve this
    return duration.replace(/PT/, '').replace(/M/, ':').replace(/S/, '');
}

// Display videos in grid
function displayVideos(videos) {
    const grid = document.getElementById('videoGrid');
    
    if (!videos || videos.length === 0) {
        grid.innerHTML = '<div class="no-results">No videos found</div>';
        return;
    }
    
    grid.innerHTML = videos.map(video => `
        <div class="video-card" onclick="playVideoWithAd('${video.youtubeId}')">
            <div class="video-thumbnail">
                <img src="https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg" 
                     alt="${video.title}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/320x180/333/999?text=MovieFlix'">
                <span class="duration">${video.duration || '00:00'}</span>
            </div>
            <div class="video-info-card">
                <div class="video-title">${video.title.substring(0, 50)}${video.title.length > 50 ? '...' : ''}</div>
                <div class="video-channel">${video.channel || 'YouTube'}</div>
                <div class="video-views">${video.views || ''}</div>
            </div>
        </div>
    `).join('');
}

// Play video with one ad
function playVideoWithAd(videoId) {
    currentVideo = videoId;
    
    // Show ad modal
    const adModal = document.getElementById('adModal');
    adModal.style.display = 'flex';
    
    // Reset timer
    adTimer = 5;
    document.getElementById('adTimer').textContent = adTimer;
    document.getElementById('skipAd').disabled = true;
    document.getElementById('skipAd').classList.remove('enabled');
    document.getElementById('skipAd').textContent = 'Please wait...';
    
    // Start timer
    if (adInterval) clearInterval(adInterval);
    
    adInterval = setInterval(() => {
        adTimer--;
        document.getElementById('adTimer').textContent = adTimer;
        
        if (adTimer <= 0) {
            clearInterval(adInterval);
            document.getElementById('skipAd').disabled = false;
            document.getElementById('skipAd').classList.add('enabled');
            document.getElementById('skipAd').textContent = 'Watch Now →';
        }
    }, 1000);
}

// Skip ad and play video
document.getElementById('skipAd').addEventListener('click', function() {
    if (!this.disabled && currentVideo) {
        document.getElementById('adModal').style.display = 'none';
        playVideo(currentVideo);
    }
});

// Play video in player
function playVideo(videoId) {
    const playerModal = document.getElementById('playerModal');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const videoDescription = document.getElementById('videoDescription');
    
    // Try to get video info (optional)
    videoTitle.textContent = 'Now Playing';
    videoDescription.textContent = 'Enjoy your video with no interruptions';
    
    // Embed YouTube video (no ads version)
    videoPlayer.innerHTML = `
        <iframe width="100%" height="100%" 
            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&controls=1&color=white"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
        </iframe>
    `;
    
    playerModal.style.display = 'block';
}

// Close player
document.getElementById('closePlayer').addEventListener('click', function() {
    document.getElementById('playerModal').style.display = 'none';
    document.getElementById('videoPlayer').innerHTML = '';
    if (adInterval) clearInterval(adInterval);
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('playerModal').style.display = 'none';
        document.getElementById('adModal').style.display = 'none';
        document.getElementById('videoPlayer').innerHTML = '';
        if (adInterval) clearInterval(adInterval);
    }
});

// Search functionality
document.getElementById('searchBtn').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value;
    if (query.trim()) {
        loadVideos(query);
    } else {
        loadVideos('trending videos');
    }
});

// Search on Enter key
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('searchBtn').click();
    }
});

// Category filter
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const category = this.textContent.toLowerCase();
        let searchQuery = 'videos';
        
        switch(category) {
            case 'drama':
                searchQuery = 'drama series';
                break;
            case 'movies':
                searchQuery = 'full movies';
                break;
            case 'music':
                searchQuery = 'music videos';
                break;
            case 'trailers':
                searchQuery = 'movie trailers';
                break;
            case 'comedy':
                searchQuery = 'comedy videos';
                break;
            case 'education':
                searchQuery = 'educational videos';
                break;
            default:
                searchQuery = 'trending videos';
        }
        
        loadVideos(searchQuery);
    });
});

// Telegram Back Button support
if (tg) {
    tg.BackButton.onClick(function() {
        if (document.getElementById('playerModal').style.display === 'block') {
            document.getElementById('playerModal').style.display = 'none';
            document.getElementById('videoPlayer').innerHTML = '';
        } else if (document.getElementById('adModal').style.display === 'flex') {
            document.getElementById('adModal').style.display = 'none';
            clearInterval(adInterval);
        } else {
            tg.close();
        }
    });
}

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    loadVideos('trending videos');
});

// Refresh every 10 minutes (optional)
setInterval(() => {
    const activeCat = document.querySelector('.cat-btn.active').textContent.toLowerCase();
    let query = 'trending videos';
    
    switch(activeCat) {
        case 'drama': query = 'drama series'; break;
        case 'movies': query = 'full movies'; break;
        case 'music': query = 'music videos'; break;
        case 'trailers': query = 'movie trailers'; break;
        case 'comedy': query = 'comedy videos'; break;
        case 'education': query = 'educational videos'; break;
    }
    
    loadVideos(query);
}, 600000); // 10 minutes
