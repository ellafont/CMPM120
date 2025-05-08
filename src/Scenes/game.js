class GameScene extends Phaser.Scene {
    constructor() {
        super('gameScene');
        
        //high score
        this.highScore = 0;

        // Add current level tracking
        this.currentLevel = 1;
    
        // Add flags to prevent multiple level completions
        this.isLevelTransitioning = false;
        this.levelCompleteCooldown = 0;

        // Game state
        this.player = null;
        this.enemies = null;
        this.lasers = [];
        this.asteroids = null;
        this.isGameOver = false;
        this.isPaused = false; // New variable to track pause state
        
        // Game configuration
        this.enemyRows = 5;
        this.enemyCols = 8;
        this.enemyDirection = 1;
        this.enemySpeed = 0.5;
        this.enemyDropDistance = 20;
        this.bulletSpeed = 10;
        this.maxBullets = 3;
        this.fireRate = 100; // ms between shots
        this.lastFired = 0;
        this.score = 0;
        
        // Asteroid config
        this.asteroidSpawnRate = 3000; // ms between asteroid spawns //make it so more asteroids spawn as time goes on...
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
        // Initialize level transition variables
        this.isLevelTransitioning = false;
        this.levelCompleteCooldown = 0;

        // Ensure enemies are created
        this.time.delayedCall(500, () => {
            this.forceCreateEnemies();
        });

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
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
            pause: Phaser.Input.Keyboard.KeyCodes.ESC // Add ESC key for pause
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
        //this.createEnemies();
        
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

        // Listen for ESC key to toggle pause
        this.input.keyboard.on('keydown-ESC', this.togglePause, this);

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


    // Add this new method for pausing the game
    
// Add this new method for pausing the game
togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
        // Pause physics
        this.physics.pause();
        
        // Clear any existing pause elements first (in case of any lingering elements)
        if (this.pauseElements) {
            this.pauseElements.clear(true, true);
        }
        
        // Create a fresh group for pause elements
        this.pauseElements = this.add.group();
        
        // Create semi-transparent overlay
        this.pauseOverlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        );
        this.pauseElements.add(this.pauseOverlay);
        
        // Create pause title
        this.pauseTitle = this.add.text(
            this.cameras.main.width / 2,
            50,
            'GAME PAUSED',
            {
                fontFamily: 'Arial',
                fontSize: '40px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        this.pauseTitle.setOrigin(0.5);
        this.pauseElements.add(this.pauseTitle);
        
        // Show controls
        this.showControls();
        
        // Show credits
        this.showCredits();
        
        // Resume instructions
        this.resumeText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            'Press ESC to resume',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        this.resumeText.setOrigin(0.5);
        this.pauseElements.add(this.resumeText);
        
        // Make the text flash for visibility
        this.tweens.add({
            targets: this.resumeText,
            alpha: 0.5,
            duration: 500,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });
    } else {
        // Resume physics
        this.physics.resume();
        
        // Remove all pause elements
        if (this.pauseElements) {
            this.pauseElements.clear(true, true);
            this.pauseElements.destroy();
            this.pauseElements = null;
        }
        
        // Explicitly destroy any text elements that might be lingering
        if (this.pauseTitle) {
            this.pauseTitle.destroy();
            this.pauseTitle = null;
        }
        
        if (this.resumeText) {
            this.resumeText.destroy();
            this.resumeText = null;
        }
        
        // Destroy control and credit text arrays
        if (this.controlTexts) {
            this.controlTexts.forEach(text => {
                if (text) text.destroy();
            });
            this.controlTexts = [];
        }
        
        if (this.creditTexts) {
            this.creditTexts.forEach(text => {
                if (text) text.destroy();
            });
            this.creditTexts = [];
        }
        
        // Destroy overlay
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }
}

    // Add these methods for showing controls and credits
showControls() {
    // Controls title
    const controlsTitle = this.add.text(
        this.cameras.main.width / 2,
        120,
        'CONTROLS',
        {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        }
    );
    controlsTitle.setOrigin(0.5);
    
    // Controls instructions
    const controls = [
        'A / LEFT ARROW - Move Left',
        'D / RIGHT ARROW - Move Right',
        'SPACE - Fire Laser',
        'ESC - Pause/Resume Game'
    ];
    
    let y = 160;
    this.controlTexts = [];
    
    controls.forEach(control => {
        const text = this.add.text(
            this.cameras.main.width / 2,
            y,
            control,
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff'
            }
        );
        text.setOrigin(0.5);
        this.controlTexts.push(text);
        y += 30;
    });
    
    // Add to pause elements group
    if (this.pauseElements) {
        this.pauseElements.add(controlsTitle);
        this.controlTexts.forEach(text => this.pauseElements.add(text));
    }
}

showCredits() {
    // Credits title
    const creditsTitle = this.add.text(
        this.cameras.main.width / 2,
        300,
        'CREDITS',
        {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        }
    );
    creditsTitle.setOrigin(0.5);
    
    // Credits text
    const credits = [
        'Art Assets: Kenney (www.kenney.nl)',
        'Game Programming: Ella',
        'CMPM 120 - Game Development'
    ];
    
    let y = 340;
    this.creditTexts = [];
    
    credits.forEach(credit => {
        const text = this.add.text(
            this.cameras.main.width / 2,
            y,
            credit,
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff'
            }
        );
        text.setOrigin(0.5);
        this.creditTexts.push(text);
        y += 30;
    });
    
    // Add to pause elements group
    if (this.pauseElements) {
        this.pauseElements.add(creditsTitle);
        this.creditTexts.forEach(text => this.pauseElements.add(text));
    }
}

    update(time, delta) {
        // Skip update if game is over
        if (this.isGameOver || this.isPaused) return;

        this.updateStarfield();

        // Level completion cooldown (prevent rapid level transitions)
        if (this.levelCompleteCooldown > 0) {
            this.levelCompleteCooldown -= delta;
        }
        
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
        
        // Check if all enemies are destroyed, with proper safeguards
        if (this.enemies && 
            this.enemies.getChildren().length === 0 && 
            !this.isLevelTransitioning && 
            this.levelCompleteCooldown <= 0) {
                
            console.log("No enemies detected - completing level");
            this.levelComplete();
        }

    }
    
// Replace createEnemies with this fixed version
createEnemies() {
    // Safety check to prevent creating enemies during a transition
    if (this.isLevelTransitioning && this.levelCompleteCooldown > 2000) {
        console.log("Skipping enemy creation during transition");
        return;
    }
    
    console.log("Creating enemies for level " + this.currentLevel);
    
    // Clear any existing enemies first
    if (this.enemies) {
        this.enemies.clear(true, true);
    } else {
        this.enemies = this.add.group();
    }
    
    // Enemy types from the sprite atlas
    const enemyTypes = [
        'shipPink.png',
        'shipGreen.png',
        'shipBlue.png',
        'shipBeige.png'
    ];
    
    try {
        // Choose formation based on current level
        const formation = this.getFormation(this.currentLevel);
        
        if (!formation || !formation.positions || formation.positions.length === 0) {
            console.error("Invalid formation returned for level " + this.currentLevel);
            // Create at least one enemy to prevent level completion race condition
            const enemy = this.physics.add.sprite(
                this.cameras.main.width / 2,
                100,
                'ships',
                enemyTypes[0]
            );
            enemy.setScale(0.3);
            enemy.points = 50;
            this.enemies.add(enemy);
        } else {
            // Create enemies according to the chosen formation
            formation.positions.forEach((position, index) => {
                // Choose enemy type based on row/position in the formation
                const enemyType = enemyTypes[index % enemyTypes.length];
                
                // Create enemy with appropriate sprite
                const enemy = this.physics.add.sprite(
                    position.x,
                    position.y,
                    'ships',
                    enemyType
                );
                
                // Set properties
                enemy.setScale(0.3);
                enemy.points = Math.floor((this.cameras.main.height - position.y) / 30) * 10;
                
                // Add to group
                this.enemies.add(enemy);
            });
        }
        
        console.log("Created " + this.enemies.getChildren().length + " enemies");
    } catch (error) {
        console.error("Error creating enemies: " + error);
        // Create at least one enemy as fallback
        const enemy = this.physics.add.sprite(
            this.cameras.main.width / 2,
            100,
            'ships',
            enemyTypes[0]
        );
        enemy.setScale(0.3);
        enemy.points = 50;
        this.enemies.add(enemy);
    }
    
    // Display level number for 2 seconds
    const levelText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 3,
        'LEVEL ' + this.currentLevel,
        {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }
    );
    levelText.setOrigin(0.5);
    
    // Make level text fade out
    this.tweens.add({
        targets: levelText,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        delay: 1000,
        onComplete: () => {
            levelText.destroy();
        }
    });
}


getFormation(level) {
    // Ensure level is a positive number
    level = Math.max(1, level || 1);
    
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Default spacing and position values
    const defaultEnemyWidth = 40;
    const defaultEnemyHeight = 40;
    const defaultXSpacing = 60;
    const defaultYSpacing = 50;
    const defaultXStart = (screenWidth - (this.enemyCols * defaultXSpacing)) / 2 + 30;
    const defaultYStart = 80;
    
    // Array to hold enemy positions
    let positions = [];
    
    try {
        // Choose formation based on level number (cycle through formations as levels increase)
        switch ((level - 1) % 7) {
            case 0: // Standard grid (Level 1, 8, 15, etc.)
                // Create grid of enemies (at least 3x3)
                const rows = Math.min(this.enemyRows, 5);
                const cols = Math.min(this.enemyCols, 8);
                
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        positions.push({
                            x: defaultXStart + col * defaultXSpacing,
                            y: defaultYStart + row * defaultYSpacing
                        });
                    }
                }
                break;
                
            // Other formation cases stay the same...
            case 1: // V formation
                const vCenterX = screenWidth / 2;
                const vTopY = 80;
                const vSpread = 40;
                
                for (let i = 0; i < 20; i++) {
                    const row = Math.floor(i / 4);
                    const col = i % 4;
                    
                    if (col < 2) {
                        positions.push({
                            x: vCenterX - (vSpread * (row + 1)) - (col * vSpread / 2),
                            y: vTopY + row * vSpread
                        });
                    } else {
                        positions.push({
                            x: vCenterX + (vSpread * (row + 1)) + ((col - 2) * vSpread / 2),
                            y: vTopY + row * vSpread
                        });
                    }
                }
                break;
                
            // Other cases...
            default: // Fallback to simple grid if something goes wrong
                // Create a simple grid as fallback
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 5; col++) {
                        positions.push({
                            x: defaultXStart + col * defaultXSpacing,
                            y: defaultYStart + row * defaultYSpacing
                        });
                    }
                }
                break;
        }
    } catch (error) {
        console.error("Error in getFormation: " + error);
        // Fallback to simple formation
        for (let i = 0; i < 5; i++) {
            positions.push({
                x: screenWidth / 2 - 100 + i * 50,
                y: 100
            });
        }
    }
    
    // Safety check: ensure we have at least some positions
    if (positions.length === 0) {
        console.warn("No enemy positions generated, using fallback");
        positions.push({
            x: screenWidth / 2,
            y: 100
        });
    }
    
    return { positions };
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
        console.log("Level " + this.currentLevel + " complete called");
        
        // Set transitioning flag to prevent multiple calls
        this.isLevelTransitioning = true;
        
        // Set a long cooldown
        this.levelCompleteCooldown = 10000; // 10 seconds cooldown
        
        // Clear any existing level complete text to avoid overlap
        if (this.levelCompleteText) {
            this.levelCompleteText.destroy();
        }
        
        // Create a background rectangle for better text visibility
        const textBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400,
            100,
            0x000000,
            0.7
        );
        textBg.setOrigin(0.5);
        
        // Create level complete text with improved styling
        this.levelCompleteText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'LEVEL ' + this.currentLevel + ' COMPLETE!',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        this.levelCompleteText.setOrigin(0.5);
        
        // Group the text and background for animation
        const levelCompleteGroup = this.add.group();
        levelCompleteGroup.add(textBg);
        levelCompleteGroup.add(this.levelCompleteText);
        
        // Store the current level before incrementing
        const completedLevel = this.currentLevel;
        
        // Increment level counter
        this.currentLevel++;
        
        console.log("Moving from level " + completedLevel + " to level " + this.currentLevel);
        
        // Increase difficulty
        this.enemySpeed += 0.05;
        this.asteroidSpawnRate = Math.max(1000, this.asteroidSpawnRate - 200);
        
        // Remove text and background after delay and create new enemies
        this.time.delayedCall(2000, () => {
            // Fade out animation before destruction
            this.tweens.add({
                targets: levelCompleteGroup.getChildren(),
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    levelCompleteGroup.clear(true, true);
                    this.levelCompleteText = null;
                    
                    // Force create new enemies with a delay to ensure transition completes
                    this.time.delayedCall(100, () => {
                        this.forceCreateEnemies();
                    });
                }
            });
        });
    }
    
    forceCreateEnemies() {
        console.log("Force creating enemies for level " + this.currentLevel);
        
        // Ensure any existing enemies are cleared
        if (this.enemies) {
            this.enemies.clear(true, true);
        }
        
        // Create a fresh enemy group
        this.enemies = this.add.group();
        
        // Get screen dimensions for positioning
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Enemy types from the sprite atlas
        const enemyTypes = [
            'shipPink.png',
            'shipGreen.png',
            'shipBlue.png',
            'shipBeige.png'
        ];
        
        // Default positioning values
        const defaultXSpacing = 60;
        const defaultYSpacing = 50;
        const defaultXStart = (screenWidth - (8 * defaultXSpacing)) / 2 + 30;
        const defaultYStart = 80;
        
        // Generate enemy positions based on level
        let enemyPositions = [];
        
        switch ((this.currentLevel - 1) % 7) {
            case 0: // Standard grid (Level 1, 8, 15, etc.)
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 8; col++) {
                        enemyPositions.push({
                            x: defaultXStart + col * defaultXSpacing,
                            y: defaultYStart + row * defaultYSpacing
                        });
                    }
                }
                break;
                
            case 1: // V formation
                const vCenterX = screenWidth / 2;
                const vTopY = 80;
                const vSpread = 40;
                
                for (let i = 0; i < 20; i++) {
                    const row = Math.floor(i / 4);
                    const col = i % 4;
                    
                    if (col < 2) {
                        // Left side of V
                        enemyPositions.push({
                            x: vCenterX - (vSpread * (row + 1)) - (col * vSpread / 2),
                            y: vTopY + row * vSpread
                        });
                    } else {
                        // Right side of V
                        enemyPositions.push({
                            x: vCenterX + (vSpread * (row + 1)) + ((col - 2) * vSpread / 2),
                            y: vTopY + row * vSpread
                        });
                    }
                }
                break;
                
            case 2: // Diamond formation
                const diamondCenterX = screenWidth / 2;
                const diamondTopY = 80;
                const diamondSize = 40;
                const diamondRows = 7;
                
                for (let row = 0; row < diamondRows; row++) {
                    // Calculate width of this row (diamond shape)
                    const rowEnemies = row < diamondRows/2 
                        ? row * 2 + 1  // Increasing width for top half
                        : (diamondRows - row) * 2 - 1; // Decreasing width for bottom half
                    
                    const rowWidth = rowEnemies * diamondSize;
                    const rowStartX = diamondCenterX - rowWidth / 2 + diamondSize / 2;
                    
                    for (let col = 0; col < rowEnemies; col++) {
                        enemyPositions.push({
                            x: rowStartX + col * diamondSize,
                            y: diamondTopY + row * diamondSize
                        });
                    }
                }
                break;
                
            case 3: // Circle formation
                const circleCenterX = screenWidth / 2;
                const circleCenterY = screenHeight / 4 + 50;
                const radius = 120;
                const enemies = 24;
                
                for (let i = 0; i < enemies; i++) {
                    const angle = (i / enemies) * Math.PI * 2;
                    enemyPositions.push({
                        x: circleCenterX + Math.cos(angle) * radius,
                        y: circleCenterY + Math.sin(angle) * radius
                    });
                }
                
                // Add some enemies in the center
                for (let i = 0; i < 5; i++) {
                    enemyPositions.push({
                        x: circleCenterX,
                        y: circleCenterY
                    });
                }
                break;
                
            case 4: // Two rows
                const twoRowsY1 = 80;
                const twoRowsY2 = 140;
                const twoRowsSpacing = 60;
                
                // First row (top)
                for (let col = 0; col < 10; col++) {
                    enemyPositions.push({
                        x: 100 + col * twoRowsSpacing,
                        y: twoRowsY1
                    });
                }
                
                // Second row (bottom, offset)
                for (let col = 0; col < 9; col++) {
                    enemyPositions.push({
                        x: 130 + col * twoRowsSpacing,
                        y: twoRowsY2
                    });
                }
                break;
                
            case 5: // Random scattered formation
                for (let i = 0; i < 30; i++) {
                    enemyPositions.push({
                        x: 100 + Math.random() * (screenWidth - 200),
                        y: 80 + Math.random() * 150
                    });
                }
                break;
                
            case 6: // Wave formation
                const waveBaseY = 100;
                const waveHeight = 80;
                const wavePeriod = screenWidth / 2;
                
                for (let col = 0; col < 30; col++) {
                    const x = 60 + col * 25;
                    // Use sine function to create wave pattern
                    const y = waveBaseY + Math.sin((x / wavePeriod) * Math.PI * 2) * waveHeight;
                    
                    enemyPositions.push({ x, y });
                }
                break;
                
            default: // Simple grid as fallback
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 5; col++) {
                        enemyPositions.push({
                            x: defaultXStart + col * defaultXSpacing,
                            y: defaultYStart + row * defaultYSpacing
                        });
                    }
                }
                break;
        }
        
        // Ensure we have at least one enemy
        if (enemyPositions.length === 0) {
            console.warn("No enemy positions, adding fallback enemy");
            enemyPositions.push({
                x: screenWidth / 2,
                y: 100
            });
        }
        
        console.log("Creating " + enemyPositions.length + " enemies");
        
        // Create enemies from positions
        enemyPositions.forEach((position, index) => {
            // Choose enemy type
            const enemyType = enemyTypes[index % enemyTypes.length];
            
            // Create enemy
            const enemy = this.physics.add.sprite(
                position.x,
                position.y,
                'ships',
                enemyType
            );
            
            // Set properties
            enemy.setScale(0.3);
            enemy.points = Math.floor((this.cameras.main.height - position.y) / 30) * 10;
            
            // Add to group
            this.enemies.add(enemy);
        });
        
        // Display new level number
        const levelBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            200,
            80,
            0x000000,
            0.7
        );
        levelBg.setOrigin(0.5);
        
        const levelText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            'LEVEL ' + this.currentLevel,
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        );
        levelText.setOrigin(0.5);
        
        // Group the level indicator elements
        const levelGroup = this.add.group();
        levelGroup.add(levelBg);
        levelGroup.add(levelText);
        
        // Apply animation
        levelGroup.getChildren().forEach(child => {
            child.setScale(0.1);
            this.tweens.add({
                targets: child,
                scale: 1,
                duration: 400,
                ease: 'Back.out'
            });
        });
        
        // Make level text fade out
        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: levelGroup.getChildren(),
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    levelGroup.clear(true, true);
                    
                    // Reset the transition flag after animations complete
                    this.time.delayedCall(500, () => {
                        this.isLevelTransitioning = false;
                        this.levelCompleteCooldown = 0;
                        console.log("Level transition complete, ready for gameplay");
                    });
                }
            });
        });
        
        return this.enemies.getChildren().length; // Return number of enemies created
    }
    
    // Update gameOver method to reset level counter
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
    
        // Show level reached
        const levelText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 5,
            'Level Reached: ' + this.currentLevel,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        );
        levelText.setOrigin(0.5);
    
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
            this.currentLevel = 1;
            this.isLevelTransitioning = false;
            this.levelCompleteCooldown = 0;
        
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
