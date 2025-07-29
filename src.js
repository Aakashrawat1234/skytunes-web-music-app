let songs;
let currentSong = new Audio();
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`songs/${folder}/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;

        songs = [];
        Array.from(div.getElementsByTagName("a")).forEach(element => {
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        });

        // Update song list UI
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = songs.map(song => `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ").replaceAll(".mp3", "")}</div>
                    <div></div>
                </div>
                <div class="playnow">
                    <span>play now</span>
                    <img class="invert sideplay" src="images/play.svg" alt="">
                </div>
            </li>
        `).join("");

        // Add click listeners
        Array.from(songUL.getElementsByTagName("li")).forEach(li => {
            li.addEventListener("click", () => {
                playMusic(li.querySelector(".info div").textContent.trim() + ".mp3");
            });
        });

        return songs;
    } catch (error) {
        console.error("Error loading songs:", error);
        return [];
    }
}

function playMusic(track, pause = false) {
    if (!track || !currFolder) return;
    
    currentSong.src = `songs/${currFolder}/${encodeURI(track)}`;
    document.querySelector(".songinfo").innerHTML = track.replace(".mp3", "");
    
    if (!pause) {
        currentSong.play()
            .then(() => {
                document.querySelector("#play img").src = "images/pause.svg";
            })
            .catch(error => {
                console.error("Playback failed:", error);
                alert("Failed to play music. Please check console for details.");
            });
    }
}

async function displayAlbums() {
    const musicFolders = ['anime', 'pahadi', 'english', 'rock', 'ponk', 'jazz', 'brainrot', 'gym', 'eminem', 'sad', 'romentic', 'asian'];
    const cardContainer = document.querySelector('.cardContainer');
    cardContainer.innerHTML = '';

    for (const folder of musicFolders) {
        try {
            const info = await (await fetch(`songs/${folder}/info.json`)).json();
            
            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="48" height="48" viewBox="0 0 48 48">
                            <path fill="#000" d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"/>
                        </svg>
                    </div>
                    <img class="album-cover" src="songs/${folder}/cover.jpg" 
                         onerror="this.src='images/default-cover.jpg'"
                         alt="${info.title}">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
        } catch (error) {
            console.warn(`Skipping ${folder}:`, error);
        }
    }

    // Add card click handlers
    cardContainer.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => getSongs(card.dataset.folder));
    });
}

async function main() {
    // Initialize UI
    document.querySelector(".songinfo").textContent = "No song selected";
    document.querySelector(".songtime").textContent = "00:00 / 00:00";

    // Load initial songs
    await displayAlbums();
    songs = await getSongs("ncs");
    if (songs.length > 0) playMusic(songs[0], true);

    // Player controls
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.querySelector("#play img").src = "images/pause.svg";
        } else {
            currentSong.pause();
            document.querySelector("#play img").src = "images/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent = 
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = 
            `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = e.offsetX / e.target.clientWidth;
        currentSong.currentTime = percent * currentSong.duration;
    });

    // Navigation controls
    document.getElementById("previous").addEventListener("click", () => {
        const currentIndex = songs.indexOf(currentSong.src.split("/").pop());
        if (currentIndex > 0) playMusic(songs[currentIndex - 1]);
    });

    document.getElementById("next").addEventListener("click", () => {
        const currentIndex = songs.indexOf(currentSong.src.split("/").pop());
        if (currentIndex < songs.length - 1) playMusic(songs[currentIndex + 1]);
    });

    // Mobile menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
}

// Start the app
main();
