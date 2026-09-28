// ASET FOTO KUCING
const PHOTO_LIST = ["foto1.jpg", "foto2.jpg", "foto3.jpg", "foto4.jpg", "foto5.jpg"];

const SONG_DATABASE = {
    song1: {
        src: "lagu1.mp3",
        lyrics: [
            { t: 1,  text: "I want one ticket out of your heavy gaze" },
            { t: 5,  text: "I want one ticket off of your carousel" },
            { t: 9,  text: "I want one ticket off of your carousel" },
            { t: 14, text: "But you should know that I die slow" },
            { t: 18, text: "Running through the halls of your haunted home" },
            { t: 22, text: "And the toughest part is that we both know" },
            { t: 26, text: "What happened to you" },
            { t: 28, text: "Why you're out on your own" },
            { t: 31, text: "Merry Christmas, please don't call" },
            { t: 36, text: "Merry Christmas, I'm not yours at all" },
            { t: 40, text: "Merry Christmas, please don't call me" }
        ]
    },
    song2: {
        src: "lagu2.mp3",
        lyrics: [
            { t: 0,  text: "Lagu 2: Baris lirik pertama di sini" },
            { t: 4,  text: "Lagu 2: Baris lirik kedua di sini" },
            { t: 8,  text: "Lagu 2: Baris lirik ketiga di sini" },
            { t: 12, text: "Lagu 2: Baris lirik keempat di sini" }
        ]
    }
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('audio');
const startBtn = document.getElementById('start-btn');
const replayBtn = document.getElementById('replay-btn');
const songSelect = document.getElementById('song-select');
const themeSelect = document.getElementById('theme-select');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let isMobile = width < 600;
let currentTheme = "theme-sakura";

const loadedImages = [];
PHOTO_LIST.forEach(src => {
    let img = new Image();
    img.src = src;
    loadedImages.push(img);
});

// BINTANG BACKGROUND
const stars = [];
for (let i = 0; i < (isMobile ? 15 : 30); i++) {
    stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005
    });
}

// PARTIKEL MELAYANG SESUAI TEMA
const themeParticles = [];
const particleCount = isMobile ? 8 : 15;

for (let i = 0; i < particleCount; i++) {
    themeParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 12 + Math.random() * 8,
        speedY: 0.6 + Math.random() * 1.0,
        speedX: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 2
    });
}

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    isMobile = width < 600;
});

let currentLyrics = SONG_DATABASE.song1.lyrics;
let activeHearts = [];
let floatingPhotos = [];
let noteParticles = [];
let trailParticles = [];
let nextLyricIdx = 0;
let photoIndex = 0;
let isPlaying = false;
let isFinished = false;
let currentSide = 'left';

// Event Ganti Tema & Karakter Partikel
themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    document.body.className = currentTheme;
});

// Event Ganti Lagu
songSelect.addEventListener('change', (e) => {
    let selectedSongKey = e.target.value;
    audio.src = SONG_DATABASE[selectedSongKey].src;
    currentLyrics = SONG_DATABASE[selectedSongKey].lyrics;
    if (isPlaying) replayAudioAndLyrics();
});

// Trail Kursor Touch
class TrailHeart {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10 + Math.random() * 8;
        this.alpha = 1;
        this.decay = 0.04;
        this.speedY = -1;
    }
    update() {
        this.y += this.speedY;
        this.alpha -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = currentTheme === 'theme-forest' ? '#70e000' : (currentTheme === 'theme-galaxy' ? '#00b4d8' : '#ff8fa3');
        ctx.font = `${this.size}px Helvetica`;
        ctx.fillText("♥", this.x, this.y);
        ctx.restore();
    }
}

window.addEventListener('mousemove', (e) => trailParticles.push(new TrailHeart(e.clientX, e.clientY)));
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) trailParticles.push(new TrailHeart(e.touches[0].clientX, e.touches[0].clientY));
});

function playAudioWithFadeIn() {
    audio.volume = 0;
    audio.currentTime = 0;
    audio.play().catch(() => {});

    let fadeInterval = setInterval(() => {
        if (audio.volume < 0.95) audio.volume += 0.05;
        else { audio.volume = 1; clearInterval(fadeInterval); }
    }, 100);
}

// BALON HATI LIRIK (UKURAN DIPERKECIL UNTUK HP)
class HeartCard {
    constructor(text, x, y) {
        this.fullText = text;
        this.displayText = "";
        this.x = x;
        this.y = y;
        this.typewriterIndex = 0;
        this.speed = 65;
        // Skala diperkecil dari 6 jadi 4.2 khusus HP biar gak nutupin layar
        this.scale = isMobile ? 4.2 : 6.5; 
        
        this.typeInterval = setInterval(() => {
            if (this.typewriterIndex < this.fullText.length) {
                this.displayText += this.fullText[this.typewriterIndex];
                this.typewriterIndex++;
            } else clearInterval(this.typeInterval);
        }, 60);
    }

    update(dt) { this.y -= this.speed * dt; }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        let heartColor = "#ff6584";
        if (currentTheme === "theme-galaxy") heartColor = "#3a86ff";
        if (currentTheme === "theme-forest") heartColor = "#2a9d8f";
        if (currentTheme === "theme-sunset") heartColor = "#f4a261";

        ctx.shadowColor = heartColor;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < 360; i += 10) {
            let angle = (i * Math.PI) / 180;
            let hx = 16 * Math.pow(Math.sin(angle), 3);
            let hy = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
            let px = hx * this.scale;
            let py = hy * this.scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = heartColor;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = isMobile ? "bold 10px Helvetica" : "bold 13px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        this.wrapText(this.displayText, 0, 0, isMobile ? 95 : 150, 14);
        ctx.restore();
    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        let words = text.split(' ');
        let line = '';
        let lines = [];

        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else line = testLine;
        }
        lines.push(line);

        let startY = y - ((lines.length - 1) * lineHeight) / 2;
        for (let k = 0; k < lines.length; k++) {
            ctx.fillText(lines[k], x, startY + (k * lineHeight));
        }
    }
}

// FOTO POLAROID MELAYANG
class FloatingPhoto {
    constructor(img) {
        this.img = img;
        this.rotation = (Math.random() - 0.5) * 0.3;
        
        let maxDimension = isMobile ? 90 : 130;
        let aspect = (img.width && img.height) ? (img.width / img.height) : 1;

        if (aspect >= 1) {
            this.w = maxDimension;
            this.h = maxDimension / aspect;
        } else {
            this.h = maxDimension;
            this.w = maxDimension * aspect;
        }

        // Foto dimunculkan tepat di area tengah layar HP
        this.x = width / 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.y = height + 100;
        this.vy = -(45 + Math.random() * 15);
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    isOutOfBounds() { return (this.y < -150); }

    draw() {
        if (!this.img.complete) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        let padding = 5;
        let bottomPadding = 15;
        let frameW = this.w + padding * 2;
        let frameH = this.h + padding + bottomPadding;

        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 10;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-frameW / 2, -padding - this.h / 2, frameW, frameH);

        ctx.shadowBlur = 0;
        ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

// PARTIKEL NOT MUSIK
class NoteParticle {
    constructor() {
        let symbols = ["♪", "♫", "♥"];
        if (currentTheme === "theme-forest") symbols = ["🌿", "✨", "🎵"];
        if (currentTheme === "theme-galaxy") symbols = ["⭐", "✨", "🎶"];
        if (currentTheme === "theme-sunset") symbols = ["🌇", "✨", "♪"];

        this.char = symbols[Math.floor(Math.random() * symbols.length)];
        this.size = 12 + Math.random() * 10;
        this.x = Math.random() * (width - 40) + 20;
        this.y = height + 30;
        this.speed = 35 + Math.random() * 35;
    }

    update(dt) { this.y -= this.speed * dt; }

    draw() {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${this.size}px Helvetica`;
        ctx.fillText(this.char, this.x, this.y);
    }
}

let lastTime = performance.now();
let lastParticleSpawn = 0;
let lastPhotoSpawn = 0;

function replayAudioAndLyrics() {
    playAudioWithFadeIn();
    activeHearts = [];
    floatingPhotos = [];
    nextLyricIdx = 0;
    photoIndex = 0;
    isPlaying = true;
    isFinished = false;
    replayBtn.style.display = 'none';
}

function animate(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;

    ctx.clearRect(0, 0, width, height);

    // Bintang
    stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Partikel Tema
    themeParticles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > height + 20) { p.y = -20; p.x = Math.random() * width; }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.font = `${p.size}px Helvetica`;

        if (currentTheme === "theme-sakura") ctx.fillText("🌸", 0, 0);
        else if (currentTheme === "theme-galaxy") ctx.fillText("✨", 0, 0);
        else if (currentTheme === "theme-forest") ctx.fillText("🍃", 0, 0);
        else if (currentTheme === "theme-sunset") ctx.fillText("🌹", 0, 0);

        ctx.restore();
    });

    // Trail Kursor
    trailParticles.forEach((tp, idx) => {
        tp.update();
        tp.draw();
        if (tp.alpha <= 0) trailParticles.splice(idx, 1);
    });

    if (isPlaying) {
        let currentTime = audio.currentTime;

        // Lirik Zigzag (Diarahkan lebih ke pinggir kiri & kanan biar foto di tengah kelihatan)
        if (nextLyricIdx < currentLyrics.length && currentTime >= currentLyrics[nextLyricIdx].t) {
            let offset = isMobile ? (width * 0.28) : 150;
            let heartX = (currentSide === 'left') ? (width / 2 - offset) : (width / 2 + offset);

            activeHearts.push(new HeartCard(currentLyrics[nextLyricIdx].text, heartX, height - 80));
            currentSide = (currentSide === 'left') ? 'right' : 'left';
            nextLyricIdx++;
        }

        // Foto Melayang
        if (loadedImages.length > 0 && now - lastPhotoSpawn > 5000) {
            let currentImg = loadedImages[photoIndex % loadedImages.length];
            floatingPhotos.push(new FloatingPhoto(currentImg));
            photoIndex++;
            lastPhotoSpawn = now;
        }

        // Not Musik
        if (now - lastParticleSpawn > 1200) {
            noteParticles.push(new NoteParticle());
            lastParticleSpawn = now;
        }

        if (audio.ended || (nextLyricIdx >= currentLyrics.length && activeHearts.length === 0 && floatingPhotos.length === 0)) {
            if (!isFinished) {
                isFinished = true;
                isPlaying = false;
                replayBtn.style.display = 'block';
            }
        }
    }

    noteParticles.forEach((p, idx) => {
        p.update(dt);
        p.draw();
        if (p.y < -50) noteParticles.splice(idx, 1);
    });

    // Ditarik FOTO dulu baru BALON HATI (Biar foto berada di belakang balon jika bersentuhan)
    floatingPhotos.forEach((ph, idx) => {
        ph.update(dt);
        ph.draw();
        if (ph.isOutOfBounds()) floatingPhotos.splice(idx, 1);
    });

    activeHearts.forEach((h, idx) => {
        h.update(dt);
        h.draw();
        if (h.y < -200) activeHearts.splice(idx, 1);
    });

    requestAnimationFrame(animate);
}

startBtn.addEventListener('click', () => {
    replayAudioAndLyrics();
    startBtn.style.display = 'none';
});

replayBtn.addEventListener('click', replayAudioAndLyrics);

requestAnimationFrame(animate);