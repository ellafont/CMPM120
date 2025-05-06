class GameScene extends Phaser.Scene {
    constructor() {
        super('gameScene');
        this.player = null;
        this.laser = null;
        this.keys = null;
        this.isLaserActive = false;
    }

    preload() {
        this.load.setPath("./assets/");

        // Load sprite atlas
        this.load.atlasXML("ships", "sheet.png", "sheet.xml");
        this.load.atlasXML("lasers", "spritesheet_lasers.png", "spritesheet_lasers.xml");
        
        // Update instruction text (if needed)
        if (document.getElementById('description')) {
            document.getElementById('description').innerHTML = '<h2>Space Shooter<br>A, left- move left // D, right - move right // SPACE - fire</h2>';
        }
    }

    create() {
        // Set background color

        // Create player ship at bottom center of screen
        this.player = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            'ships',
            'cockpitRed_1.png'
        );
    
        // Scale down the ship to fit better
        this.player.setScale(0.8);
        
        // Set up keyboard input
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Create the laser object but make it inactive initially
        this.laser = this.physics.add.sprite(0, 0, 'lasers', 'laserGreen2.png');
        this.laser.setScale(0.5);
        this.laser.setVisible(false);
        this.laser.setActive(false);
    }

    update() {
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
        
        // Handle laser firing
        if (Phaser.Input.Keyboard.JustDown(this.keys.fire) && !this.isLaserActive) {
            this.fireLaser();
        }
        
        // Update laser position if active
        if (this.isLaserActive) {
            this.laser.y -= 10;
            
            // Deactivate laser when it goes off-screen
            if (this.laser.y < -this.laser.height) {
                this.resetLaser();
            }
        }
    }
    
    fireLaser() {
        // Activate the laser
        this.isLaserActive = true;
        this.laser.setVisible(true);
        this.laser.setActive(true);
        
        // Position the laser at the player's position
        this.laser.x = this.player.x;
        this.laser.y = this.player.y - this.player.height * 0.4;
    }
    
    resetLaser() {
        // Deactivate the laser
        this.isLaserActive = false;
        this.laser.setVisible(false);
        this.laser.setActive(false);
    }
}


// class GameScene extends Phaser.Scene {
//     constructor() {
//         super('gameScene');
//         this.player = null;
//         this.laser = null;
//         this.keys = null;
//         this.isLaserActive = false;
//         this.my = {sprite: {}};

//         this.playerX = this.cameras.main.width / 2;
//         this.playerY =  this.cameras.main.height - 50;
//     }

//     preload() {
//         // Load the sprite sheet
//         // this.load.spritesheet('ships', 'assets/sheet.png', {
//         //     frameWidth: 124,
//         //     frameHeight: 90
//         // });
        
//         // this.load.image('laser', 'assets/laserGreen2.png');

//         this.load.setPath("./assets/");

//         // Load sprite atlas
//         this.load.atlasXML("lasers", "spritesheet_lasers.png", "spritesheet_lasers.png.xml");
//         this.load.atlasXML("ships", "sheet.png", "sheet.xml");
        
//         // update instruction text
//         //document.getElementById('description').innerHTML = '<h2>Monster.js<br>S - smile // F - show fangs<br>A - move left // D - move right</h2>'
    
//     }

//     create() {
//         // Set background color
//         //this.cameras.main.setBackgroundColor('#000033');
//         let my = this.my;

//         my.sprite.player = this.physics.add.sprite(playerX, playerY, "ships", "cockpitRed_1.png");
//         my.sprite.laser = this.add.sprite(this.player.x, this.player.y, "lasers", "laserGreen2.png");

//         // Create player ship at bottom center of screen (using shipBlue)
//         // this.player = this.physics.add.sprite(
//         //     this.cameras.main.width / 2,
//         //     this.cameras.main.height - 50,
//         //     'ships'
//         // );
    
//         // Scale down the ship to fit better
//         this.player.setScale(0.8);
        
//         // Set up keyboard input
//         this.keys = this.input.keyboard.addKeys({
//             left: Phaser.Input.Keyboard.KeyCodes.A,
//             right: Phaser.Input.Keyboard.KeyCodes.D,
//             fire: Phaser.Input.Keyboard.KeyCodes.SPACE
//         });
        
//         // this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
//         // this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
//         // this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
//         // this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

//         // Create the laser object but make it inactive initially
//         this.laser = this.physics.add.sprite(0, 0, 'laser');
//         this.laser.setScale(0.5);
//         this.laser.setVisible(false);
//         this.laser.setActive(false);
//     }

//     update() {
//         // Handle player movement (left/right only)
//         if (this.keys.left.isDown) {
//             this.player.x -= 5;
//         } else if (this.keys.right.isDown) {
//             this.player.x += 5;
//         }
        
//         // Prevent player from going off-screen
//         this.player.x = Phaser.Math.Clamp(
//             this.player.x, 
//             this.player.width * 0.35, 
//             this.cameras.main.width - this.player.width * 0.35
//         );
        
//         // Handle laser firing
//         if (Phaser.Input.Keyboard.JustDown(this.keys.fire) && !this.isLaserActive) {
//             this.fireLaser();
//         }
        
//         // Update laser position if active
//         if (this.isLaserActive) {
//             this.laser.y -= 10;
            
//             // Deactivate laser when it goes off-screen
//             if (this.laser.y < -this.laser.height) {
//                 this.resetLaser();
//             }
//         }
//     }
    
//     fireLaser() {
//         // Activate the laser
//         this.isLaserActive = true;
//         this.laser.setVisible(true);
//         this.laser.setActive(true);
        
//         // Position the laser at the player's position
//         this.laser.x = this.player.x;
//         this.laser.y = this.player.y - this.player.height * 0.4;
//     }
    
//     resetLaser() {
//         // Deactivate the laser
//         this.isLaserActive = false;
//         this.laser.setVisible(false);
//         this.laser.setActive(false);
//     }
// }
