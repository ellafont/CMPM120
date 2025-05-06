// // Jim Whitehead
// // Created: 4/14/2024
// // Phaser: 3.70.0
// //
// // Cubey
// //
// // An example of putting sprites on the screen using Phaser
// // 
// // Art assets from Kenny Assets "Shape Characters" set:
// // https://kenney.nl/assets/shape-characters

// // debug with extreme prejudice
// "use strict"

// // Game configuration
// const config = {
//     type: Phaser.AUTO,
//     width: 800,
//     height: 600,
//     physics: {
//         default: 'arcade',
//         arcade: {
//             gravity: { y: 0 },
//             debug: false
//         }
//     },
//     scene: [GameScene],
//     fps: { forceSetTimeOut: true, target: 30 }
// };

// // Create the game with the configuration
// const game = new Phaser.Game(config);

"use strict"

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene],
    fps: { forceSetTimeOut: true, target: 30 }
};

// Create the game with the configuration
const game = new Phaser.Game(config);

