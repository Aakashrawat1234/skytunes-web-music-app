let songs = [];
let currentSong = new Audio();
let currFolder = "";

// Utility function for time display
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Load songs from a folder
async function getSongs(folder) {
    currFolder = folder;
    try {
        // Fetch directory listing
        const response = await fetch(`songs/${folder}/`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract MP3 files
        songs = Array.from(doc.querySelectorAll('a'))
            .map(link => link.href)
            .filter(href => href.endsWith('.mp3'))
            .map(href => href.split('/').pop());
        
        // Update song list UI
        const songList = document.querySelector('.songList ul');
        songList.innerHTML = songs.map(song => `
            <li>
                <img src="images/music.svg" class="invert" alt="">
                <div class="info">
                    <div>${decodeURI(song.replace('.mp3', ''))}</div>
                    <div></div>
                </div>
                <div class="playnow">
                    <span>play now</span>
                    <img src="images/play.svg" class="invert sideplay" alt="">
                </div>
            </li>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.songList li').forEach((li, index) => {
            li.addEventListener('click', () => playSong(songs[index]));
        });
        
        return songs;
    } catch (error) {
        console.error("Error loading songs:", error);
        return [];
    }
}

// Play a specific song
function playSong(filename) {
    if (!filename || !currFolder) return;
    
    currentSong.src = `songs/${currFolder}/${encodeURIComponent(filename)}`;
    document.querySelector('.songinfo').textContent = filename.replace('.mp3', '');
    
    currentSong.play()
        .then(() => {
            document.querySelector('#play img').src = "images/pause.svg";
        })
        .catch(error => {
            console.error("Playback failed:", error);
            alert(`Cannot play: ${filename}\nCheck console for details.`);
        });
}

// Load all album cards
async function displayAlbums() {
    const genres = ['anime', 'eminem', 'rock', 'pahadi', 'english', 'jazz'];
    const container = document.querySelector('.cardContainer');
    container.innerHTML = '';
    
    for (const genre of genres) {
        try {
            // Load album info
            const info = await (await fetch(`songs/${genre}/info.json`)).json();
            
            // Create card
            container.innerHTML += `
                <div class="card" data-folder="${genre}">
                    <div class="play">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <path fill="currentColor" d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    <img src="songs/${genre}/cover.jpg" 
                         onerror="this.src='images/default-cover.jpg'" 
                         alt="${info.title}">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
        } catch (error) {
            console.warn(`Skipping ${genre}:`, error);
        }
    }
    
    // Add card click handlers
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => getSongs(card.dataset.folder));
    });
}

// Initialize the player
async function initPlayer() {
    // Setup event listeners
    document.getElementById('play').addEventListener('click', () => {
        if (currentSong.paused) {
            currentSong.play();
            document.querySelector('#play img').src = "images/pause.svg";
        } else {
            currentSong.pause();
            document.querySelector('#play img').src = "images/play.svg";
        }
    });
    
    document.getElementById('previous').addEventListener('click', () => {
        const currentIndex = songs.indexOf(currentSong.src.split('/').pop());
        if (currentIndex > 0) playSong(songs[currentIndex - 1]);
    });
    
    document.getElementById('next').addEventListener('click', () => {
        const currentIndex = songs.indexOf(currentSong.src.split('/').pop());
        if (currentIndex < songs.length - 1) playSong(songs[currentIndex + 1]);
    });
    
    document.querySelector('.seekbar').addEventListener('click', e => {
        const percent = e.offsetX / e.target.clientWidth;
        currentSong.currentTime = percent * currentSong.duration;
    });
    
    currentSong.addEventListener('timeupdate', () => {
        document.querySelector('.songtime').textContent = 
            `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        document.querySelector('.circle').style.left = 
            `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });
    
    // Mobile menu toggle
    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.left').style.left = '0';
    });
    document.querySelector('.close').addEventListener('click', () => {
        document.querySelector('.left').style.left = '-120%';
    });
    
    // Initial load
    await displayAlbums();
    await getSongs('ncs'); // Default folder
    if (songs.length > 0) playSong(songs[0]);
}

// Start the player
initPlayer();
