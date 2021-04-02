class Preloader extends Phaser.Scene {

    constructor ()
    {
        super('Preloader');
    }
    preload ()
    {
        

        let _gW = this.game.config.width,
            _gH = this.game.config.height;

        this.add.text ( _gW/2, _gH/2, '', { fontSize: 36, fontFamily:'Oswald', color:'#fff'}).setOrigin(0.5);

        let txt = this.add.text (_gW/2, _gH*0.43, 'Loading : 0%', { color:'#333', fontFamily:'Oswald', fontSize:20 }).setOrigin(0.5);

        //..
        let brct = this.add.rectangle ( (_gW - 350 )/2, _gH/2, 350, 40 ).setStrokeStyle (2, 0x0a0a0a).setOrigin(0, 0.5);
        //..
        let rW = 340, rH = 30;

        let rct = this.add.rectangle ( (_gW - rW)/2, _gH/2, 5, rH, 0x3a3a3a, 1 ).setOrigin(0, 0.5);

        this.load.on ('complete', function () {
            this.scene.start('Login');
        }, this);

        this.load.on ('progress', function (progress) {

            txt.setText ( 'Loading : ' + Math.ceil( progress * 100 ) + '%' );

            if ( (rW * progress) > 5) rct.setSize ( rW * progress, rH );

        });

        
        this.load.audioSprite('sfx', 'client/assets/sfx/fx_mixdown.json', [
            'client/assets/sfx/sfx.ogg',
            'client/assets/sfx/sfx.mp3'
        ]);
        this.load.audio ('bgsound2', [ 'client/assets/sfx/bgsound.ogg', 'client/assets/sfx/bgsound.mp3'] );

        this.load.audio ('bgsound', [ 'client/assets/sfx/bgsound2.ogg', 'client/assets/sfx/bgsound2.mp3'] );

        this.load.image ('bgimage', 'client/assets/images/bg.png');


        this.load.image ('eprofile', 'client/assets/images/username/eprofile.png');


        //intro..
        this.load.image ('title', 'client/assets/images/intro/title.png');
        this.load.image ('bg_img1', 'client/assets/images/intro/profile_plcmnt.png');
        this.load.image('prompt', 'client/assets/images/intro/connect/prompt.png');
        this.load.image('invite', 'client/assets/images/intro/connect/invite.png');
        this.load.image('pairing_img', 'client/assets/images/intro/connect/pairing_placement.png');

        this.load.spritesheet('menu_intro', 'client/assets/images/intro/menu_intro.png', { frameWidth: 260, frameHeight: 260 });
        this.load.spritesheet('keys', 'client/assets/images/intro/connect/keyboardBtns.png', { frameWidth: 85, frameHeight: 85 });
        this.load.spritesheet('circ0', 'client/assets/images/intro/connect/waiting.png', { frameWidth: 100, frameHeight: 100 });
        this.load.spritesheet('prompt_btns', 'client/assets/images/intro/connect/prompt_btns.png', { frameWidth: 224, frameHeight: 58 });
  

        //main...
        this.load.image ('center_img', 'client/assets/images/main/center.png');
        this.load.image ('prompt_xl', 'client/assets/images/main/prompt_xl.png');
        this.load.image ('prompt_sm', 'client/assets/images/main/prompt_sm.png');
        this.load.image ('indicator_bg', 'client/assets/images/main/indicator_bg.png');

        this.load.spritesheet('indicator_turn', 'client/assets/images/main/indicator_turn.png', { frameWidth: 53, frameHeight: 53 });
        this.load.spritesheet('cntrl_btns', 'client/assets/images/main/cntrl_btns.png', { frameWidth: 72, frameHeight: 72 });
        this.load.spritesheet('prompt_btns2', 'client/assets/images/main/prompt_btns.png', { frameWidth: 155, frameHeight: 46 });         
        this.load.spritesheet('thumbs', 'client/assets/images/main/spritesheet1.png', { frameWidth: 50, frameHeight: 50 });
        this.load.spritesheet('circles', 'client/assets/images/main/circles.png', { frameWidth: 100, frameHeight: 100 });


    }
    
}
