// Elemen DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const difficultyElement = document.getElementById('difficulty');
const fireRateElement = document.getElementById('fireRate');
const damageElement = document.getElementById('damage');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const finalLevelElement = document.getElementById('finalLevel');
const enemiesDestroyedElement = document.getElementById('enemiesDestroyed');
const restartButton = document.getElementById('restartButton');
const lifeIcons = [
    document.getElementById('life1'),
    document.getElementById('life2'),
    document.getElementById('life3')
];

// Variabel game
let score = 0;
let level = 1;
let lives = 3;
let enemiesDestroyed = 0;
let gameOver = false;
let animationId;
let gameTime = 0;

// Ukuran canvas
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Objek pemain - PERBAIKAN BUG PERGERAKAN
const player = {
    x: canvasWidth / 2,
    y: canvasHeight - 80,
    width: 60,
    height: 60,
    speed: 8,
    color: '#00eeff',
    isShooting: false,
    shootCooldown: 0,
    shootDelay: 25, // Diperlambat dari 15 ke 25 (semakin besar semakin lambat)
    bulletSpeed: 12,
    bulletDamage: 1,
    bulletColor: '#00eeff',
    engineGlow: 0
};

// Array untuk peluru
let bullets = [];

// Array untuk musuh - DIPERMUDAH DI LEVEL AWAL
let enemies = [];

// Array untuk power-ups
let powerUps = [];

// Array untuk efek partikel
let particles = [];

// Array untuk efek latar belakang
let backgroundStars = [];
let nebulas = [];

// Inisialisasi latar belakang
function initBackground() {
    // Bintang-bintang
    for (let i = 0; i < 150; i++) {
        backgroundStars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random() * 0.8 + 0.2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
    
    // Nebula
    for (let i = 0; i < 4; i++) {
        nebulas.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            radius: Math.random() * 100 + 50,
            color: `hsla(${Math.random() * 60 + 250}, 70%, 30%, ${Math.random() * 0.1 + 0.05})`
        });
    }
}

// Musuh spawn rate - DIPERMUDAH DI LEVEL AWAL
let enemySpawnRate = 100; // Lebih jarang di level awal (dari 70)
let enemySpawnCounter = 0;

// Event listener untuk mouse movement - PERBAIKAN BUG BATAS KANAN
canvas.addEventListener('mousemove', (e) => {
    if (gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    
    // PERBAIKAN: Hitung posisi mouse dengan benar
    // Batasi pemain dalam canvas (PERBAIKAN BUG)
    mouseX = Math.max(player.width / 2, Math.min(mouseX, canvasWidth - player.width / 2));
    player.x = mouseX;
});

// Event listener untuk mouse click (menembak)
canvas.addEventListener('mousedown', () => {
    if (gameOver) return;
    player.isShooting = true;
});

canvas.addEventListener('mouseup', () => {
    player.isShooting = false;
});

// Event listener untuk restart button
restartButton.addEventListener('click', restartGame);

// Fungsi untuk menggambar pemain
function drawPlayer() {
    // Efek glow mesin
    player.engineGlow = (player.engineGlow + 0.1) % (Math.PI * 2);
    const glowIntensity = Math.sin(player.engineGlow) * 0.3 + 0.7;
    
    // Body pesawat (desain futuristik)
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Glow effect
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    
    // Main body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 3);
    ctx.lineTo(player.width / 2, player.height / 3);
    ctx.lineTo(10, player.height / 2);
    ctx.lineTo(-10, player.height / 2);
    ctx.lineTo(-player.width / 2, player.height / 3);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -5, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = `rgba(255, 100, 0, ${glowIntensity})`;
    ctx.beginPath();
    ctx.ellipse(0, player.height / 2 + 15, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine details
    ctx.fillStyle = '#444444';
    ctx.fillRect(-8, player.height / 2 + 5, 16, 10);
    ctx.fillStyle = '#222222';
    ctx.fillRect(-5, player.height / 2 + 8, 10, 5);
    
    // Wings
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2 - 10, player.height / 4, 10, 5);
    ctx.fillRect(player.width / 2, player.height / 4, 10, 5);
    
    ctx.restore();
}

// Fungsi untuk menembak
function shoot() {
    if (player.shootCooldown <= 0 && player.isShooting) {
        // Tembakan utama
        bullets.push({
            x: player.x,
            y: player.y - player.height / 3,
            width: 6,
            height: 20,
            speed: player.bulletSpeed,
            damage: player.bulletDamage,
            color: player.bulletColor,
            type: 'laser'
        });
        
        player.shootCooldown = player.shootDelay;
        
        // Efek partikel tembakan
        createMuzzleFlash(player.x, player.y - player.height / 3);
    }
    
    if (player.shootCooldown > 0) {
        player.shootCooldown--;
    }
}

// Fungsi untuk efek muzzle flash
function createMuzzleFlash(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: Math.random() * 4 - 2,
            speedY: Math.random() * -3 - 2,
            color: '#ffff00',
            life: 10
        });
    }
}

// Fungsi untuk menggambar dan mengupdate peluru
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Gambar peluru dengan efek glow
        ctx.save();
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = bullet.color;
        
        if (bullet.type === 'laser') {
            // Laser bullet
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
            
            // Laser trail
            ctx.globalAlpha = 0.5;
            ctx.fillRect(bullet.x - bullet.width / 4, bullet.y + bullet.height / 2, bullet.width / 2, bullet.height * 2);
        }
        
        ctx.restore();
        
        // Gerakkan peluru
        bullet.y -= bullet.speed;
        
        // Hapus peluru jika keluar dari layar
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

// Fungsi untuk membuat musuh baru - DIPERMUDAH DI LEVEL AWAL
function spawnEnemy() {
    // Di level awal (1-3), hanya spawn musuh mudah
    let enemyType;
    if (level <= 3) {
        // Level 1-3: Hanya Scout (80%) dan sedikit Fighter (20%)
        enemyType = Math.random() < 0.8 ? 0 : 1;
    } else if (level <= 6) {
        // Level 4-6: Campuran semua jenis
        enemyType = Math.floor(Math.random() * 3);
    } else {
        // Level 7+: Lebih banyak musuh sulit
        enemyType = Math.floor(Math.random() * 3);
        if (Math.random() < 0.4) enemyType = 2; // 40% chance Bomber di level tinggi
    }
    
    let size, speed, health, color, points;
    
    // PENYESUAIAN: Musuh lebih lambat di level awal
    let baseSpeedMultiplier = 1.0;
    if (level <= 3) baseSpeedMultiplier = 0.6; // 40% lebih lambat di level 1-3
    else if (level <= 6) baseSpeedMultiplier = 0.8; // 20% lebih lambat di level 4-6
    
    switch(enemyType) {
        case 0: // Scout (cepat, HP rendah)
            size = 25;
            speed = (Math.random() * 1.5 + 1.0) * baseSpeedMultiplier; // Lebih lambat
            health = 1;
            color = '#ff5555';
            points = 10;
            break;
        case 1: // Fighter (kecepatan sedang, HP sedang)
            size = 35;
            speed = (Math.random() * 1.0 + 0.8) * baseSpeedMultiplier; // Lebih lambat
            health = level <= 3 ? 1 : 2; // HP lebih rendah di level awal
            color = '#ffaa00';
            points = 20;
            break;
        case 2: // Bomber (lambat, HP tinggi)
            size = 45;
            speed = (Math.random() * 0.8 + 0.5) * baseSpeedMultiplier; // Lebih lambat
            health = level <= 6 ? 2 : 3; // HP lebih rendah di level awal-menengah
            color = '#aa55ff';
            points = 30;
            break;
    }
    
    enemies.push({
        x: Math.random() * (canvasWidth - size * 2) + size,
        y: -size,
        width: size,
        height: size,
        speed: speed,
        color: color,
        health: health,
        maxHealth: health,
        points: points,
        type: enemyType,
        rotation: 0
    });
}

// Fungsi untuk membuat power-up
function spawnPowerUp(x, y) {
    const powerUpType = Math.floor(Math.random() * 3);
    let color, type;
    
    switch(powerUpType) {
        case 0: // Rapid Fire
            color = '#00eeff';
            type = 'rapid';
            break;
        case 1: // Damage Boost
            color = '#ff3366';
            type = 'damage';
            break;
        case 2: // Shield
            color = '#55ff55';
            type = 'shield';
            break;
    }
    
    powerUps.push({
        x: x,
        y: y,
        size: 20,
        color: color,
        type: type,
        rotation: 0
    });
}

// Fungsi untuk menggambar dan mengupdate musuh
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Update rotasi
        enemy.rotation += 0.02;
        
        // Gambar musuh dengan desain yang berbeda berdasarkan tipe
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);
        
        // Glow effect
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 15;
        
        // Gambar berdasarkan tipe musuh
        ctx.fillStyle = enemy.color;
        
        if (enemy.type === 0) { // Scout - pesawat kecil cepat
            ctx.beginPath();
            ctx.moveTo(0, -enemy.height / 2);
            ctx.lineTo(enemy.width / 2, enemy.height / 4);
            ctx.lineTo(0, enemy.height / 2);
            ctx.lineTo(-enemy.width / 2, enemy.height / 4);
            ctx.closePath();
            ctx.fill();
        } 
        else if (enemy.type === 1) { // Fighter - pesawat sedang
            ctx.beginPath();
            ctx.ellipse(0, 0, enemy.width / 2, enemy.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Sayap
            ctx.fillRect(-enemy.width / 2 - 5, -enemy.height / 6, 10, enemy.height / 3);
            ctx.fillRect(enemy.width / 2 - 5, -enemy.height / 6, 10, enemy.height / 3);
        }
        else { // Bomber - pesawat besar
            ctx.beginPath();
            // Menggunakan rect untuk roundRect yang lebih kompatibel
            ctx.fillRect(-enemy.width / 2, -enemy.height / 3, enemy.width, enemy.height / 1.5);
            
            // Kokpit
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -enemy.height / 6, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Health bar (hanya untuk musuh dengan health > 1)
        if (enemy.maxHealth > 1) {
            const healthPercent = enemy.health / enemy.maxHealth;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-enemy.width / 2, -enemy.height / 2 - 10, enemy.width, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-enemy.width / 2, -enemy.height / 2 - 10, enemy.width * healthPercent, 4);
        }
        
        ctx.restore();
        
        // Gerakkan musuh
        enemy.y += enemy.speed;
        
        // Cek tabrakan dengan pemain
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + enemy.width / 2)) {
            // Tabrakan dengan pemain
            enemies.splice(i, 1);
            lives--;
            updateLifeDisplay();
            createExplosion(enemy.x, enemy.y, enemy.color);
            
            if (lives <= 0) {
                gameOver = true;
            }
            continue;
        }
        
        // Hapus musuh jika keluar dari layar
        if (enemy.y > canvasHeight + enemy.height) {
            enemies.splice(i, 1);
        }
    }
    
    // Spawn musuh baru - DIPERMUDAH DI LEVEL AWAL
    enemySpawnCounter++;
    
    // Level awal: musuh lebih jarang muncul
    let currentSpawnRate = enemySpawnRate;
    if (level <= 3) {
        currentSpawnRate = 120; // Sangat jarang di level 1-3
    } else if (level <= 6) {
        currentSpawnRate = 90; // Agak jarang di level 4-6
    }
    
    if (enemySpawnCounter >= currentSpawnRate) {
        spawnEnemy();
        enemySpawnCounter = 0;
    }
}

// Fungsi untuk update power-ups
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Update rotasi
        powerUp.rotation += 0.03;
        
        // Gambar power-up
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        ctx.rotate(powerUp.rotation);
        
        // Glow effect
        ctx.shadowColor = powerUp.color;
        ctx.shadowBlur = 15;
        
        // Gambar power-up
        ctx.fillStyle = powerUp.color;
        // Menggunakan rect untuk roundRect yang lebih kompatibel
        ctx.fillRect(-powerUp.size / 2, -powerUp.size / 2, powerUp.size, powerUp.size);
        
        // Simbol di tengah
        ctx.fillStyle = '#ffffff';
        if (powerUp.type === 'rapid') {
            // Simbol rapid fire
            ctx.beginPath();
            ctx.moveTo(-powerUp.size / 4, 0);
            ctx.lineTo(powerUp.size / 4, 0);
            ctx.moveTo(0, -powerUp.size / 4);
            ctx.lineTo(0, powerUp.size / 4);
            ctx.stroke();
        } else if (powerUp.type === 'damage') {
            // Simbol damage (segitiga)
            ctx.beginPath();
            ctx.moveTo(0, -powerUp.size / 3);
            ctx.lineTo(powerUp.size / 3, powerUp.size / 3);
            ctx.lineTo(-powerUp.size / 3, powerUp.size / 3);
            ctx.closePath();
            ctx.fill();
        } else {
            // Simbol shield (lingkaran)
            ctx.beginPath();
            ctx.arc(0, 0, powerUp.size / 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Gerakkan power-up ke bawah
        powerUp.y += 2;
        
        // Cek koleksi oleh pemain
        const dx = player.x - powerUp.x;
        const dy = player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + powerUp.size / 2)) {
            // Koleksi power-up
            collectPowerUp(powerUp.type);
            powerUps.splice(i, 1);
            createParticleBurst(powerUp.x, powerUp.y, powerUp.color);
            continue;
        }
        
        // Hapus power-up jika keluar dari layar
        if (powerUp.y > canvasHeight + powerUp.size) {
            powerUps.splice(i, 1);
        }
    }
}

// Fungsi untuk mengoleksi power-up
function collectPowerUp(type) {
    switch(type) {
        case 'rapid':
            player.shootDelay = Math.max(10, player.shootDelay - 3);
            fireRateElement.textContent = player.shootDelay <= 15 ? "Cepat" : "Sedang";
            break;
        case 'damage':
            player.bulletDamage++;
            damageElement.textContent = player.bulletDamage >= 3 ? "Tinggi" : "Normal";
            break;
        case 'shield':
            lives = Math.min(5, lives + 1);
            updateLifeDisplay();
            break;
    }
    
    // Efek suara (simulasi)
    console.log(`Power-up collected: ${type}`);
}

// Fungsi untuk update tampilan nyawa
function updateLifeDisplay() {
    for (let i = 0; i < 3; i++) {
        if (i < lives) {
            lifeIcons[i].style.opacity = "1";
        } else {
            lifeIcons[i].style.opacity = "0.3";
        }
    }
}

// Fungsi untuk update indikator kesulitan
function updateDifficulty() {
    if (level <= 3) {
        difficultyElement.textContent = "MUDAH";
        difficultyElement.style.color = "#55ff55";
    } else if (level <= 6) {
        difficultyElement.textContent = "SEDANG";
        difficultyElement.style.color = "#ffaa00";
    } else {
        difficultyElement.textContent = "SULIT";
        difficultyElement.style.color = "#ff5555";
    }
}

// Fungsi untuk cek tabrakan peluru dengan musuh
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            // Cek tabrakan
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (bullet.width + enemy.width / 2)) {
                // Tabrakan terjadi
                enemy.health -= bullet.damage;
                
                // Hapus peluru
                bullets.splice(i, 1);
                
                // Buat efek hit
                createHitEffect(bullet.x, bullet.y, enemy.color);
                
                // Cek jika musuh mati
                if (enemy.health <= 0) {
                    // Tambah skor
                    score += enemy.points;
                    scoreElement.textContent = score;
                    enemiesDestroyed++;
                    
                    // Cek level up
                    const newLevel = Math.floor(score / 150) + 1; // Lebih mudah naik level
                    if (newLevel > level) {
                        level = newLevel;
                        levelElement.textContent = level;
                        updateDifficulty();
                        
                        // Spawn power-up saat level up
                        spawnPowerUp(enemy.x, enemy.y);
                    }
                    
                    // Spawn power-up acak (25% chance, lebih sering)
                    if (Math.random() < 0.25) {
                        spawnPowerUp(enemy.x, enemy.y);
                    }
                    
                    // Buat efek ledakan
                    createExplosion(enemy.x, enemy.y, enemy.color);
                    
                    // Hapus musuh
                    enemies.splice(j, 1);
                }
                
                break;
            }
        }
    }
}

// Fungsi untuk membuat efek ledakan
function createExplosion(x, y, color) {
    const particleCount = 20; // Sedikit lebih sedikit untuk performa
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 6 + 2,
            speedX: Math.random() * 8 - 4,
            speedY: Math.random() * 8 - 4,
            color: color,
            life: 40,
            fade: 0.95
        });
    }
}

// Fungsi untuk membuat efek hit
function createHitEffect(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            color: '#ffffff',
            life: 15,
            fade: 0.9
        });
    }
}

// Fungsi untuk membuat efek partikel burst
function createParticleBurst(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: Math.random() * 5 - 2.5,
            speedY: Math.random() * 5 - 2.5,
            color: color,
            life: 30,
            fade: 0.93
        });
    }
}

// Fungsi untuk menggambar dan mengupdate partikel
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Gambar partikel
        ctx.globalAlpha = particle.life / 40;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Update posisi partikel
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        particle.size *= particle.fade || 0.97;
        
        // Hapus partikel jika sudah habis umurnya
        if (particle.life <= 0 || particle.size < 0.5) {
            particles.splice(i, 1);
        }
    }
}

// Fungsi untuk menggambar background
function drawBackground() {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#050520');
    gradient.addColorStop(0.5, '#0a0a30');
    gradient.addColorStop(1, '#050520');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Gambar nebula
    for (const nebula of nebulas) {
        const gradient = ctx.createRadialGradient(
            nebula.x, nebula.y, 0,
            nebula.x, nebula.y, nebula.radius
        );
        gradient.addColorStop(0, nebula.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Gambar bintang-bintang bergerak
    gameTime += 0.005;
    for (const star of backgroundStars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        
        // Bintang bergerak ke bawah
        const y = (star.y + gameTime * star.speed * 50) % canvasHeight;
        ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Fungsi utama game loop
function gameLoop() {
    // Gambar background
    drawBackground();
    
    // Update dan gambar semua elemen game
    shoot();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    checkCollisions();
    updateParticles();
    drawPlayer();
    
    // Cek jika game over
    if (gameOver) {
        showGameOver();
        return;
    }
    
    // Lanjutkan game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Fungsi untuk menampilkan layar game over
function showGameOver() {
    cancelAnimationFrame(animationId);
    
    // Update final stats
    finalScoreElement.textContent = score;
    finalLevelElement.textContent = level;
    enemiesDestroyedElement.textContent = enemiesDestroyed;
    
    // Tampilkan layar game over
    gameOverScreen.style.display = 'block';
}

// Fungsi untuk restart game
function restartGame() {
    // Reset semua variabel game
    score = 0;
    level = 1;
    lives = 3;
    enemiesDestroyed = 0;
    gameOver = false;
    gameTime = 0;
    
    // Reset pemain
    player.x = canvasWidth / 2;
    player.y = canvasHeight - 80;
    player.shootDelay = 25;
    player.bulletDamage = 1;
    player.bulletColor = '#00eeff';
    
    // Reset array
    bullets = [];
    enemies = [];
    powerUps = [];
    particles = [];
    
    // Reset UI
    scoreElement.textContent = score;
    levelElement.textContent = level;
    fireRateElement.textContent = "Sedang";
    damageElement.textContent = "Normal";
    updateLifeDisplay();
    updateDifficulty();
    
    // Sembunyikan layar game over
    gameOverScreen.style.display = 'none';
    
    // Mulai game loop baru
    animationId = requestAnimationFrame(gameLoop);
}

// Inisialisasi background
initBackground();

// Mulai game
restartGame();