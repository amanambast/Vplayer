const fileInput = document.getElementById("fileInput");
const player = document.getElementById("player");
const modal = document.getElementById("playerModal");

let videos = [];
let currentVideo = null;

let history = JSON.parse(localStorage.getItem("history") || "[]");
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let resume = JSON.parse(localStorage.getItem("resume") || "{}");

document.getElementById("selectBtn").onclick = () => fileInput.click();
document.getElementById("selectBtn2").onclick = () => fileInput.click();

fileInput.onchange = function () {
    const files = [...this.files];

    files.forEach(file => {
        if (!videos.some(v => v.file === file)) {
            videos.push({
                id: crypto.randomUUID(),
                name: file.name,
                file: file
            });
        }
    });

    render();
    this.value = "";
};

function render() {
    const query = document.getElementById("search").value.toLowerCase();

    const filtered = videos.filter(v =>
        v.name.toLowerCase().includes(query)
    );

    showList("videoList", filtered);

    showList("recentList",
        videos.filter(v => history.includes(v.id)).slice(0, 5)
    );

    showList("historyList",
        history.map(id => videos.find(v => v.id === id)).filter(Boolean)
    );

    showList("favoriteList",
        favorites.map(id => videos.find(v => v.id === id)).filter(Boolean)
    );
}

function showList(elementId, list) {
    const container = document.getElementById(elementId);

    container.innerHTML = "";

    if (!list.length) {
        container.innerHTML = "<p>No videos found.</p>";
        return;
    }

    list.forEach(video => {
        const card = document.createElement("div");
        card.className = "video-card";

        const name = document.createElement("span");
        name.className = "video-name";
        name.textContent = video.name;

        const play = document.createElement("button");
        play.textContent = "▶ Play";
        play.onclick = () => playVideo(video);

        const fav = document.createElement("button");
        fav.textContent = favorites.includes(video.id) ? "❤️" : "♡";

        fav.onclick = () => {
            if (favorites.includes(video.id)) {
                favorites = favorites.filter(id => id !== video.id);
            } else {
                favorites.push(video.id);
            }

            localStorage.setItem("favorites", JSON.stringify(favorites));
            render();
        };

        card.append(name, play, fav);
        container.appendChild(card);
    });
}

function playVideo(video) {
    currentVideo = video;

    player.src = URL.createObjectURL(video.file);
    modal.style.display = "block";

    player.onloadedmetadata = () => {
        const savedTime = resume[video.id] || 0;

        if (savedTime < player.duration - 2) {
            player.currentTime = savedTime;
        }

        player.play().catch(() => {});
    };

    history = [video.id, ...history.filter(id => id !== video.id)];
    history = history.slice(0, 50);

    localStorage.setItem("history", JSON.stringify(history));
    render();
}

player.addEventListener("timeupdate", () => {
    if (currentVideo) {
        resume[currentVideo.id] = player.currentTime;
        localStorage.setItem("resume", JSON.stringify(resume));
    }
});

document.getElementById("closePlayer").onclick = closePlayer;

function closePlayer() {
    player.pause();
    player.removeAttribute("src");
    player.load();
    modal.style.display = "none";
    currentVideo = null;
}

document.getElementById("forward").onclick = () => {
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
};

document.getElementById("backward").onclick = () => {
    player.currentTime = Math.max(0, player.currentTime - 10);
};

document.getElementById("speed").onchange = function () {
    player.playbackRate = Number(this.value);
};

document.getElementById("fullscreen").onclick = async () => {
    if (player.requestFullscreen) {
        await player.requestFullscreen();
    } else if (player.webkitEnterFullscreen) {
        player.webkitEnterFullscreen();
    }
};

document.getElementById("subtitleBtn").onclick = () => {
    document.getElementById("subtitleInput").click();
};

document.getElementById("subtitleInput").onchange = function () {
    const file = this.files[0];
    if (!file) return;

    const oldTrack = player.querySelector("track");
    if (oldTrack) oldTrack.remove();

    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = "Subtitle";
    track.srclang = "en";
    track.src = URL.createObjectURL(file);
    track.default = true;

    player.appendChild(track);
    this.value = "";
};

document.getElementById("search").oninput = render;

document.querySelectorAll(".tab").forEach(button => {
    button.onclick = () => {
        document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

        button.classList.add("active");
        document.getElementById(button.dataset.tab).classList.add("active");
    };
});

document.getElementById("themeBtn").onclick = () => {
    document.body.classList.toggle("light");
};

render();
