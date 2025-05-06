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
        },
        scene: [GameScene],
        fps: { 
            forceSetTimeOut: true, 
            target: 60 
        }
    };

    // Initialize game instance - will start immediately
    new Phaser.Game(config);
};
