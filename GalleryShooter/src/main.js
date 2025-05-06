// Space Shooter Game
// Updated: May 5, 2025
"use strict";

// Run game immediately when page loads
window.onload = function() {
    // Game configuration
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#000033',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },        scene: [ControlsScene, TitleScene, GameScene],
        fps: { 
            forceSetTimeOut: true, 
            target: 60 
        }
    };

    // Initialize game instance - will start immediately
    new Phaser.Game(config);
};



class TitleScene extends Phaser.Scene {
    constructor() {
        super('titleScene');
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.atlasXML("ships", "spritesheet_spaceships.png", "spritesheet_spaceships.xml");
        //this.load.image("logo", "logo.png"); // If you have a logo image
    }

    create() {
        // Title text
        const titleText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            'SPACE SHOOTER',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ffffff',
                align: 'center',
                stroke: '#4444ff',
                strokeThickness: 6
            }
        );
        titleText.setOrigin(0.5);
        
        // Start game text
        const startText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            'PRESS SPACE TO START',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                align: 'center'
            }
        );
        startText.setOrigin(0.5);
        
        // Flash effect for start text
        this.tweens.add({
            targets: startText,
            alpha: 0.2,
            duration: 800,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });
        
        // Simple animation for title demo
        // Show some demo enemies moving across the screen
        this.createDemoEnemies();
        
        // Space to start
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('gameScene');
        });
    }
    
    createDemoEnemies() {
        // Create some demo enemies that move across the screen
        const enemyTypes = ['shipPink.png', 'shipGreen.png', 'shipBlue.png'];
        
        for (let i = 0; i < 5; i++) {
            const enemy = this.add.sprite(
                -50,
                150 + i * 60,
                'ships',
                enemyTypes[i % enemyTypes.length]
            );
            enemy.setScale(0.4);
            
            // Animate them across the screen
            this.tweens.add({
                targets: enemy,
                x: this.cameras.main.width + 50,
                duration: 6000,
                ease: 'Linear',
                delay: i * 500,
                repeat: -1
            });
        }
    }
}

class ControlsScene extends Phaser.Scene {
    constructor() {
        super('controlsScene');
    }
    
    create() {
        // Controls title
        const title = this.add.text(
            this.cameras.main.width / 2,
            50,
            'CONTROLS',
            {
                fontFamily: 'Arial',
                fontSize: '40px',
                color: '#ffffff'
            }
        );
        title.setOrigin(0.5);
        
        // Controls instructions
        const controls = [
            'A / LEFT ARROW - Move Left',
            'D / RIGHT ARROW - Move Right',
            'SPACE - Fire Laser',
            'ESC - Return to Title'
        ];
        
        let y = 150;
        controls.forEach(control => {
            const text = this.add.text(
                this.cameras.main.width / 2,
                y,
                control,
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff'
                }
            );
            text.setOrigin(0.5);
            y += 40;
        });
        
        // Credits section
        const creditsTitle = this.add.text(
            this.cameras.main.width / 2,
            300,
            'CREDITS',
            {
                fontFamily: 'Arial',
                fontSize: '40px',
                color: '#ffffff'
            }
        );
        creditsTitle.setOrigin(0.5);
        
        const credits = [
            'Art Assets: Kenney (www.kenney.nl)',
            'Game Programming: [Your Name]',
            'CMPM 120 - Game Development'
        ];
        
        y = 350;
        credits.forEach(credit => {
            const text = this.add.text(
                this.cameras.main.width / 2,
                y,
                credit,
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff'
                }
            );
            text.setOrigin(0.5);
            y += 40;
        });
        
      
        
        // ESC to return to title
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('titleScene');
        });
    }
}
