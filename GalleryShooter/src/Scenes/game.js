class GameScene extends Phaser.Scene {
    constructor() {
        super('gameScene');
        
        //high score
        this.highScore = 0;

        // Game state
        this.player = null;
        this.enemies = null;
        this.lasers = [];
        this.asteroids = null;
        this.isGameOver = false;
        
        // Game configuration
        this.enemyRows = 5;
        this.enemyCols = 8;
        this.enemyDirection = 1;
        this.enemySpeed = 0.5;
        this.enemyDropDistance = 20;
        this.bulletSpeed = 10;
        this.maxBullets = 3;
        this.fireRate = 300; // ms between shots
        this.lastFired = 0;
        this.score = 0;
        
        // Asteroid config
        this.asteroidSpawnRate = 3000; // ms between asteroid spawns
        this.lastAsteroidTime = 0;
        this.asteroidSpeed = 2;
        this.maxAsteroids = 10;
    }

    preload() {
        // Set path to assets folder
        this.load.setPath("./assets/");

        // Load laser assets with proper XML file
        this.load.atlasXML("lasers", "spritesheet_lasers.png", "spritesheet_lasers.xml");
        
        // Load ship assets with proper XML file
        this.load.atlasXML("ships", "spritesheet_spaceships.png", "spritesheet_spaceships.xml");
        
        // Load meteor assets
        this.load.atlasXML("meteors", "sheet.png", "sheet.xml");
        
        // Set instructions text
        if (document.getElementById('description')) {
            document.getElementById('description').innerHTML = '<h2>Space Shooter<br>A, left- move left // D, right - move right // SPACE - fire</h2>';
        }
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#000033');
        this.createStarfield();
        
        // Create player ship using the correct sprite name from the XML
        this.player = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            'ships',
            'shipBlue_manned.png'
        );
        this.player.setScale(0.5);
        this.player.setCollideWorldBounds(true);
        
        // Set up keyboard input
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // High score text
        this.highScoreText = this.add.text(
            this.cameras.main.width - 20, 
            20, 
            'High Score: ' + this.highScore, 
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                align: 'right'
            }
        );

        //high score text outline
        this.highScoreText.setOrigin(1, 0);
    
        // Load high score from local storage
        const savedHighScore = localStorage.getItem('spaceShooterHighScore');
        if (savedHighScore) {
            this.highScore = parseInt(savedHighScore);
            this.highScoreText.setText('High Score: ' + this.highScore);
        }
        
        // Create enemies
        this.createEnemies();
        
        // Create multiple laser objects using the correct sprite name
        for (let i = 0; i < this.maxBullets; i++) {
            let laser = this.physics.add.sprite(-100, -100, 'lasers', 'laserGreen1.png');
            laser.setScale(0.5);
            laser.setVisible(false);
            laser.setActive(false);
            this.lasers.push(laser);
        }
        
        // Create asteroid group
        this.asteroids = this.add.group();
        
        // Create score text with larger font and outline for better visibility
        this.scoreText = this.add.text(20, 20, 'Score: ' + this.score, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
    }

    createStarfield() {
        // Create star layers
        this.smallStars = this.add.group();
        this.bigStars = this.add.group();
        
        // Create small stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height;
            const star = this.add.rectangle(x, y, 1, 1, 0xffffff, 0.5);
            this.smallStars.add(star);
        }
        
        // Create big stars
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height;
            const star = this.add.rectangle(x, y, 2, 2, 0xffffff, 0.8);
            this.bigStars.add(star);
        }
        
        // Move stars in update function
    }
    
    // Then in your update method:
    updateStarfield() {
        // Move stars down to create scrolling effect
        this.smallStars.getChildren().forEach(star => {
            star.y += 1; // Slow movement
            if (star.y > this.cameras.main.height) {
                star.y = 0;
                star.x = Math.random() * this.cameras.main.width;
            }
        });
        
        this.bigStars.getChildren().forEach(star => {
            star.y += 2; // Faster movement
            if (star.y > this.cameras.main.height) {
                star.y = 0;
                star.x = Math.random() * this.cameras.main.width;
            }
        });
    }


    update(time, delta) {
        // Skip update if game is over
        if (this.isGameOver) return;

        this.updateStarfield();
        
        // Handle player movement (left/right only)
        if (this.keys.left.isDown || this.keys.left2.isDown) {
            this.player.x -= 5;
        } else if (this.keys.right.isDown || this.keys.right2.isDown) {
            this.player.x += 5;
        }
        
        // Prevent player from going off-screen
        this.player.x = Phaser.Math.Clamp(
            this.player.x, 
            this.player.width * 0.35, 
            this.cameras.main.width - this.player.width * 0.35
        );
        
        // Handle laser firing with cooldown
        if (Phaser.Input.Keyboard.JustDown(this.keys.fire) && 
            time > this.lastFired + this.fireRate) {
            this.fireLaser();
            this.lastFired = time;
        }
        
        // Update active lasers
        this.lasers.forEach(laser => {
            if (laser.active) {
                laser.y -= this.bulletSpeed;
                
                // Check for collisions with enemies
                if (this.enemies) {
                    this.enemies.getChildren().forEach(enemy => {
                        if (this.checkCollision(laser, enemy)) {
                            this.hitEnemy(laser, enemy);
                        }
                    });
                }
                
                // Deactivate laser when it goes off-screen
                if (laser.y < -laser.height) {
                    laser.setActive(false);
                    laser.setVisible(false);
                }
            }
        });
        
        // Move enemies
        this.moveEnemies();
        
        // Spawn and move asteroids
        this.handleAsteroids(time);
        
        // Check collisions between asteroids and player
        if (this.asteroids) {
            this.asteroids.getChildren().forEach(asteroid => {
                if (this.checkCollision(asteroid, this.player)) {
                    this.gameOver("You were hit by an asteroid!");
                }
            });
        }
        
        // Check if all enemies are destroyed
        if (this.enemies && this.enemies.getChildren().length === 0) {
            this.time.delayedCall(500, this.levelComplete, [], this);
        }
    }
    
    createEnemies() {
        // Create enemy group
        this.enemies = this.add.group();
        
        // Calculate spacing
        const enemyWidth = 40;
        const enemyHeight = 40;
        const xSpacing = 60;
        const ySpacing = 50;
        const xStart = (this.cameras.main.width - (this.enemyCols * xSpacing)) / 2 + 30;
        const yStart = 80;
        
        // Enemy types that should be available in the XML
        const enemyTypes = [
            'shipPink.png',
            'shipGreen.png',
            'shipBlue.png',
            'shipBeige.png'
        ];
        
        // Create grid of enemies
        for (let row = 0; row < this.enemyRows; row++) {
            for (let col = 0; col < this.enemyCols; col++) {
                // Choose enemy type based on row
                let enemyType = enemyTypes[row % enemyTypes.length];
                
                // Create enemy with appropriate sprite
                const enemy = this.physics.add.sprite(
                    xStart + col * xSpacing,
                    yStart + row * ySpacing,
                    'ships',
                    enemyType
                );
                
                // Set properties
                enemy.setScale(0.3);
                enemy.points = (this.enemyRows - row) * 10; // More points for top rows
                
                // Add to group
                this.enemies.add(enemy);
            }
        }
    }
    
    moveEnemies() {
        // Get enemies group children
        if (!this.enemies) return;
        
        const enemies = this.enemies.getChildren();
        if (enemies.length === 0) return;
        
        // Check if any enemy reached the edge
        let moveDown = false;
        
        for (let enemy of enemies) {
            if (this.enemyDirection > 0 && enemy.x > this.cameras.main.width - enemy.width/2 - 10) {
                moveDown = true;
                break;
            } else if (this.enemyDirection < 0 && enemy.x < enemy.width/2 + 10) {
                moveDown = true;
                break;
            }
        }
        
        // Move enemies
        if (moveDown) {
            // Change direction and move down
            this.enemyDirection *= -1;
            
            for (let enemy of enemies) {
                enemy.y += this.enemyDropDistance;
                
                // Check if enemy has reached the player's level
                if (enemy.y > this.player.y - 50) {
                    this.gameOver("Enemies reached your ship!");
                    return;
                }
            }
        } else {
            // Move enemies horizontally
            for (let enemy of enemies) {
                enemy.x += this.enemyDirection * this.enemySpeed;
            }
        }
    }
    
    fireLaser() {
        // Find inactive laser
        let laser = this.lasers.find(laser => !laser.active);
        
        // If found an inactive laser, fire it
        if (laser) {
            laser.setActive(true);
            laser.setVisible(true);
            laser.x = this.player.x;
            laser.y = this.player.y - this.player.height * 0.4;
        }
    }
    
    // Handle asteroid spawning and movement
    handleAsteroids(time) {
        // Spawn new asteroid at random intervals
        if (time > this.lastAsteroidTime + this.asteroidSpawnRate && 
            this.asteroids.getChildren().length < this.maxAsteroids) {
            
            this.spawnAsteroid();
            this.lastAsteroidTime = time;
            
            // Gradually increase spawn rate for difficulty
            this.asteroidSpawnRate = Math.max(1000, this.asteroidSpawnRate - 50);
        }
        
        // Move asteroids and check if they're off-screen
        this.asteroids.getChildren().forEach(asteroid => {
            // Move asteroid down and maybe left/right based on its angle
            asteroid.y += this.asteroidSpeed;
            asteroid.x += asteroid.xVelocity;
            
            // Rotate asteroid
            asteroid.angle += asteroid.rotationSpeed;
            
            // Remove asteroid if it's off-screen
            if (asteroid.y > this.cameras.main.height + 100) {
                asteroid.destroy();
            }
        });
    }
    
    spawnAsteroid() {
        // Meteor types to choose from
        const meteorTypes = [
            'meteorBrown_big1.png',
            'meteorBrown_big2.png',
            'meteorBrown_big3.png',
            'meteorBrown_big4.png',
            'meteorBrown_med1.png',
            'meteorBrown_med3.png',
            'meteorGrey_big1.png',
            'meteorGrey_big2.png',
            'meteorGrey_med1.png',
            'meteorGrey_med2.png'
        ];
        
        // Random x position within the screen width
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        
        // Create asteroid sprite
        const meteorType = Phaser.Utils.Array.GetRandom(meteorTypes);
        const asteroid = this.physics.add.sprite(x, -50, 'meteors', meteorType);
        
        // Scale based on size (bigger for "big" types, smaller for "med" types)
        if (meteorType.includes('big')) {
            asteroid.setScale(0.6);
        } else {
            asteroid.setScale(0.4);
        }
        
        // Add random horizontal velocity and rotation speed
        asteroid.xVelocity = Phaser.Math.FloatBetween(-1, 1);
        asteroid.rotationSpeed = Phaser.Math.FloatBetween(-1, 1);
        
        // Add to group
        this.asteroids.add(asteroid);
    }
    
    // Using the center-radius collision detection approach from lecture
    checkCollision(objectA, objectB) {
        // Calculate radii (half width and height)
        const rxA = objectA.displayWidth / 2;
        const ryA = objectA.displayHeight / 2;
        const rxB = objectB.displayWidth / 2;
        const ryB = objectB.displayHeight / 2;
        
        // Check X-axis overlap
        if (Math.abs(objectA.x - objectB.x) > (rxA + rxB)) {
            return false;
        }
        
        // Check Y-axis overlap
        if (Math.abs(objectA.y - objectB.y) > (ryA + ryB)) {
            return false;
        }
        
        // If we get here, there's a collision
        return true;
    }
    
    hitEnemy(laser, enemy) {
        // Update score
        this.score += enemy.points;
        this.scoreText.setText('Score: ' + this.score);
        
        // Deactivate laser
        laser.setActive(false);
        laser.setVisible(false);
        laser.x = -100;
        laser.y = -100;
        
        // Remove enemy from the game
        enemy.destroy();
        
        // Increase enemy speed slightly
        this.enemySpeed += 0.02;
    }
    
    levelComplete() {
        // Create level complete text
        const levelCompleteText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'LEVEL COMPLETE!',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                align: 'center'
            }
        );
        levelCompleteText.setOrigin(0.5);
        
        // Remove text after 2 seconds and create new enemies
        this.time.delayedCall(2000, () => {
            levelCompleteText.destroy();
            
            // Create new enemies with increased difficulty
            this.enemySpeed += 0.02;
            this.createEnemies();
        });
    }
    
    gameOver(reason = "GAME OVER") {
        this.isGameOver = true;
        
        // Create game over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 80,
            "GAME OVER",
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ff0000',
                align: 'center'
            }
        );
        gameOverText.setOrigin(0.5);
        
        // Show reason if provided
        if (reason !== "GAME OVER") {
            const reasonText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 30,
                reason,
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff',
                    align: 'center'
                }
            );
            reasonText.setOrigin(0.5);
        }

        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceShooterHighScore', this.highScore);
        }
    
        // Display high score
        const highScoreText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 50,
        'High Score: ' + this.highScore,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffff00',
                align: 'center'
            }
        );
        highScoreText.setOrigin(0.5);
        
        // Show final score
        const finalScoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            'Final Score: ' + this.score,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        );
        finalScoreText.setOrigin(0.5);
        
        // Show restart instructions
        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 80,
            'Press SPACE to play again',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        );
        restartText.setOrigin(0.5);
        
        // Make restart text flash
        this.tweens.add({
            targets: restartText,
            alpha: 0.2,
            duration: 800,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });
        
        // Listen for space key to restart
        this.input.keyboard.once('keydown-SPACE', () => {
            // Reset game state
            this.score = 0;
            this.enemySpeed = 0.5;
            this.isGameOver = false;
            this.asteroidSpawnRate = 3000;
            
            // Restart game
            this.scene.restart();
        });
    }


    // Create a boss enemy
    createBoss() {
        // Create a larger enemy as a boss
        this.boss = this.physics.add.sprite(
            this.cameras.main.width / 2,
            100,
            'ships',
            'shipPink_manned.png' // Use a different ship for the boss
        );
        this.boss.setScale(1.2);
        this.boss.health = 20; // Boss has more health
        this.boss.phase = 1; // Boss has multiple phases
        
        // Boss movement pattern
        this.bossTween = this.tweens.add({
            targets: this.boss,
            x: {
                value: {
                    getEnd: () => Phaser.Math.Between(100, this.cameras.main.width - 100)
                }
            },
            ease: 'Sine.easeInOut',
            duration: 2000,
            yoyo: false,
            repeat: -1
        });
        
        // Boss firing pattern
        this.time.addEvent({
            delay: 1000,
            callback: this.bossFire,
            callbackScope: this,
            loop: true
        });
    }
    
    bossFire() {
        if (!this.boss || !this.boss.active) return;
        
        // Different firing patterns based on phase
        if (this.boss.phase === 1) {
            // Single shot
            this.createEnemyLaser(this.boss.x, this.boss.y + 30);
        } else {
            // Multiple shots in phase 2
            this.createEnemyLaser(this.boss.x - 30, this.boss.y + 30);
            this.createEnemyLaser(this.boss.x, this.boss.y + 30);
            this.createEnemyLaser(this.boss.x + 30, this.boss.y + 30);
        }
    }
    
    createEnemyLaser(x, y) {
        const laser = this.physics.add.sprite(x, y, 'lasers', 'laserRed1.png');
        laser.setScale(0.5);
        laser.setVelocityY(200);
        
        // Check for collision with player
        this.physics.add.overlap(laser, this.player, () => {
            laser.destroy();
            this.gameOver("Hit by enemy laser!");
        });
        
        // Destroy laser when it goes off screen
        this.time.delayedCall(3000, () => {
            if (laser.active) {
                laser.destroy();
            }
        });
    }

}
