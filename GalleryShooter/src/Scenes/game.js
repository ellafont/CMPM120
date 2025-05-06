class GameScene extends Phaser.Scene {
    constructor() {
        super('gameScene');
        
        // Game state
        this.player = null;
        this.enemies = null;
        this.lasers = [];
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
    }

    preload() {
        // Set path to assets folder like the Monster.js example
        this.load.setPath("./assets/");

        // Load laser assets with proper XML file
        this.load.atlasXML("lasers", "spritesheet_lasers.png", "spritesheet_lasers.xml");
        
        // Load ship assets with proper XML file
        this.load.atlasXML("ships", "spritesheet_spaceships.png", "spritesheet_spaceships.xml");
        
        // Set instructions text
        if (document.getElementById('description')) {
            document.getElementById('description').innerHTML = '<h2>Space Shooter<br>A, left- move left // D, right - move right // SPACE - fire</h2>';
        }
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#000033');
        
        // Create player ship using the correct sprite name from the XML
        this.player = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            'ships',
            'shipYellow.png' // Using shipYellow as it's likely available
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
        
        // Create score text with larger font and outline for better visibility
        this.scoreText = this.add.text(20, 20, 'Score: ' + this.score, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
    }

    update(time, delta) {
        // Skip update if game is over
        if (this.isGameOver) return;
        
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
                    this.gameOver();
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
            this.enemySpeed += 0.2;
            this.createEnemies();
        });
    }
    
    gameOver() {
        this.isGameOver = true;
        
        // Create game over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'GAME OVER',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ff0000',
                align: 'center'
            }
        );
        gameOverText.setOrigin(0.5);
        
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
            
            // Restart game
            this.scene.restart();
        });
    }
}
