let songs;
let currentSong = new Audio();
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`songs/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div")
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `
        <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div></div>
                </div>
                <div class="playnow">
                    <span>play now</span>
                <img class="invert sideplay" src="images/play.svg" alt="">
            </div></li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    });
    return songs;
}

const playMusic = (track, pause = false) => {
    if (!track) {
        document.querySelector(".songinfo").innerHTML = "No song selected";
        return;
    }

    currentSong.src = `songs/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "images/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    try {
        const musicFolders = ['anime', 'pahadi', 'english', 'rock', 'ponk', 'jazz', 'brainrot', 'gym', 'eminem', 'sad', 'romentic', 'asian'];
        const cardContainer = document.querySelector('.cardContainer');
        cardContainer.innerHTML = '';

        for (const folder of musicFolders) {
            try {
                const infoResponse = await fetch(`songs/${folder}/info.json`);
                if (!infoResponse.ok) {
                    console.warn(`No info.json found in ${folder}`);
                    continue;
                }

                const albumInfo = await infoResponse.json();

                const cardHTML = `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                            <g transform="translate(24, 24) scale(1.5) translate(-12, -12)" stroke="black" fill="none">
                                <path
                                    d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                    stroke-width="1.5" fill="#000" stroke-linejoin="round" />
                            </g>
                        </svg>
                    </div>
                    <img class="album-cover" src="/songs/${folder}/cover.jpg" 
                         onerror="this.src='/images/default-cover.jpg'"
                         alt="${albumInfo.title}">
                    <h2>${albumInfo.title}</h2>
                    <p>${albumInfo.description}</p>
                </div>`;

                cardContainer.insertAdjacentHTML('beforeend', cardHTML);

            } catch (error) {
                console.error(`Error with folder ${folder}:`, error);
            }
        }

        // Add click handlers to all cards
        cardContainer.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', async () => {
                const folder = card.dataset.folder;
                await getSongs(folder);
            });
        });

    } catch (error) {
        console.error('Critical error:', error);
    }
}

async function main() {
    document.querySelector(".songinfo").innerHTML = "No song selected";
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // Get the list of all songs
    songs = await getSongs("songs/ncs");
    playMusic(songs[0], true)

    // Display all the albums on the page
    await displayAlbums();

    // Attach an event listener to play next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "images/pause.svg"
        }
        else {
            currentSong.pause();
            play.src = "images/play.svg"
        }
    })

    // Listen for time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    // Add an event listener to seek bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Add event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    })

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })

    // Add an event listener to previous and next
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })
}

// Start the application
main();
