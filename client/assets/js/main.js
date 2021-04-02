
let socket;

window.onload = function () {

    const config = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            parent: 'game_div',
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1280,
            height: 720
        },
        backgroundColor: '#cacaca',
        scene: [ Preloader, Login, SceneA, SceneB ]
    };

    new Phaser.Game(config);

} 
