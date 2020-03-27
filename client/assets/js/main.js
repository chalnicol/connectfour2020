
window.onload = function () {


    //SCENES..
    var SceneA = new Phaser.Class({

        Extends: Phaser.Scene,
    
        initialize:
    
        function SceneA ()
        {
            Phaser.Scene.call(this, { key: 'sceneA' });
        },
        preload: function ()
        {
            //...    
        },
        create : function () {

            this.grid = [];

            this.isGameOn = true;

            this.circles = [];

            this.isPlayer = false;

            this.createMusicAndSound();

            this.createGraphics();

            this.addIndicators();

            this.createMyMask();


        },
        createMusicAndSound : function () {
            
            this.music = this.sound.addAudioSprite('sfx').setVolume (0.8);

        },
        createGraphics : function () {

            var bg = this.add.image ( _gameW/2, _gameH/2, 'bgimage').setScale(_xscale);

            var bgCenter = this.add.image ( _gameW/2, _gameH/2, 'center_img').setScale(_xscale);

            var bs = Math.floor ( 100 * _xscale ),
                bx = (_gameW - (7 * bs))/2,
                by = Math.floor ( 100 * _yscale );

            var _this = this;

            this.rects = [];

            for ( var i = 0; i < 42; i++ ) {

                var ix = Math.floor ( i / 7 ),
                    iy = i % 7;

                var xp = bx + (iy * bs) + bs/2,
                    yp = by + (ix * bs) + bs/2;

                var cbg = this.add.image ( xp, yp, 'circles', 3 ).setScale(_xscale);

                var rect = this.add.image ( xp, yp, 'circles', 0 ).setScale(_xscale).setDepth(999);

                var circ = this.add.circle ( xp, yp, bs*0.383, 0xcecece, 0 );

                //var txt = this.add.text ( xp, yp, ix + ':' +iy, { color : '#000', fontSize : bs*0.18, fontFamily:'Verdana' }).setOrigin(0.5);
                //var txt = this.add.text ( xp, yp, i, { color : '#000', fontSize : bs*0.25, fontFamily:'Verdana' }).setOrigin(0.5);

                this.rects.push (circ);

                this.grid.push ({
                    'x' : xp,
                    'y' : yp,
                    'row' : ix,
                    'col' : iy,
                    'r' : bs*0.383,
                    'isTaken' : false,
                    'resident' : '-'
                });

            }

            for ( var i = 0; i < 7; i++ ) {

                var brect = this.add.rectangle( bx + (i * bs), by, bs, bs*6, 0x33aa33, 0 ).setOrigin(0).setData ('cnt', i).setInteractive();

                brect.on ('pointerover', function () {
                    if ( !_this.isGameOn ) return;

                    this.setFillStyle (0x00ff00, 0.3)
                    //_this.showDeep (this.getData('cnt'));
                });
                brect.on ('pointerout', function () {
                    this.setFillStyle (0x33aa33, 0 )
                    //_this.resetDeep();
                });
                brect.on ('pointerdown', function () {
                    
                    if ( !_this.isGameOn ) return;

                    //this.setFillStyle (0x33aa33, 0 )

                    _this.createCircle (this.getData('cnt'));
                   
                    //_this.resetDeep();

                });

            }

           

        },
        addIndicators : function () {

            var sX = 465 * _xscale,
                sY = 45 * _yscale,
                sW = 350 * _xscale,
                sH = 80 * _yscale;

            this.self_ind = new PlayerIndicator (this, 'self', sX, sY, sW, sH, 'Nong');

            this.oppo_ind = new PlayerIndicator (this, 'oppo', sX + sW, sY, sW, sH, 'Chalnicol');

             
        },
        createMyMask : function () {

            this.shape = this.make.graphics();
            
            this.shape.fillStyle(0xff33ff);
            
            this.shape.beginPath();

            this.shape.fillRect ( 263, 100, 755, 616 );

            this.masker = this.shape.createGeometryMask();

        },
        createCircle : function ( numbr ) {

            var _this = this;

            var deep = this.getDeep(numbr);

            if ( deep == null ) {

                console.log ('hey')
                this.music.play ('error', { volume : 0.3 });
            }else {

                this.isPlayer = !this.isPlayer;

                var playerID = this.isPlayer ? 0 : 1;

                var bs = Math.floor ( 116 * _xscale );

                var xp = this.grid [deep].x,
                    yp = this.grid [deep].y;

                var clr = this.isPlayer ? 0xff0000 : 0x0000ff;

                var frame = this.isPlayer ? 1 : 2;

                var circ = this.add.image ( xp, _gameH *0.08, 'circles', frame ).setScale (_xscale );

                this.tweens.add ({
                    targets : circ,
                    y : yp,
                    duration : 300,
                    ease : 'Bounce',
                    easeParams : [0.9, 1],
                    onComplete : function () {
                        //...
                    }
                });

                //circ.setMask(this.masker);
                this.music.play ('clickb', { volume : 0.8 });

                this.circles.push ( circ );

                this.grid [deep].isTaken  = true;
                this.grid [deep].resident  = playerID;

                this.checkWin ( playerID, deep );

        }

        },
        showDeep : function ( numbr ) {

            var deep = this.getDeep ( numbr );

            if ( deep != null ) this.rects [deep].setFillStyle (0x00ff00, 1);

        },
        resetDeep : function () {
            for ( var i in this.rects ) {
                this.rects[i].setFillStyle (0xcecece, 1);
            }
        },
        getDeep : function  (col) {

            for ( var i = 0; i < 6; i++ ) {

                var deep = col  + ((5-i) * 7 );

                if ( !this.grid [deep].isTaken ) {
                    return deep;
                }
                
            }
            return null;

        },
        checkWin : function (playerid, pos ) {

            var tempStr = playerid == 0 ? '0000' : '1111';

            var verStr = this.checkVertical (pos);
            var horStr = this.checkHorizontal (pos);
            var bacStr = this.checkBackSlash (pos);
            var forStr = this.checkForwardSlash (pos);

            if ( verStr.includes (tempStr) || horStr.includes (tempStr) || bacStr.includes (tempStr) || forStr.includes (tempStr) ) 
                this.endGame ();
        },
        endGame : function () {

            var _this = this;

            this.isGameOn = false;
            this.music.play ('harp');

            this.showEndImage();

        },
        showEndImage : function () {

            var _this = this;

            var endImage = this.add.image ( _gameW/2, _gameH/2, 'pwin').setScale(_xscale).setInteractive().setDepth(999);
            endImage.on ('pointerdown', function () {
                //this.destroy();

                //_this.resetGame();
            });

        },
        resetGame : function () {
            
            this.music.play ('beep', { volume : 0.5});

            for ( var i in this.circles ) {
                this.circles [i].destroy();
            }
            for ( var j in this.grid ) {
                this.grid [j].isTaken = false;
                this.grid [j].resident = '-';
            }
            this.isGameOn = true;

        },
        checkVertical : function ( gp ) {

            var r = this.grid[gp].row,
                c = this.grid[gp].col;

            var tmpR = r;

            var str = "";

            while ( tmpR <= 5 ) {
                
                var tmpPos = ( tmpR * 7 ) + c;

                tmpR += 1;

                str += this.grid [tmpPos].resident.toString();

            }

            return str;

        },
        checkHorizontal : function ( gp ) {

            var r = this.grid[gp].row,
                c = this.grid[gp].col;

            var tmpC = 0;

            var str = "";

            while ( tmpC <= 6 ) {

                var tmpPos = ( r * 7 ) + tmpC;

                tmpC += 1;

                str += this.grid [tmpPos].resident.toString();

            }

            return str;

        },
        checkBackSlash : function ( gp ) {

            var r = this.grid[gp].row,
                c = this.grid[gp].col;

            var tmpC = c; tmpR = r;

            while ( tmpR > 0 && tmpC > 0 ) {
         
                tmpR += -1;
                tmpC += -1;
            }

            var str = "";
            while ( tmpR <=5 && tmpC <= 6 ) {
                
                var tmpPos = ( tmpR * 7 ) + tmpC;

                tmpR += 1;
                tmpC += 1;

                str += this.grid [tmpPos].resident.toString();

            }

            return str;

        },
        checkForwardSlash : function ( gp ) {

            var r = this.grid[gp].row,
                c = this.grid[gp].col;

            var tmpC = c; tmpR = r;

            while ( tmpR > 0 && tmpC <= 5 ) {
             
                tmpR += -1;
                tmpC += 1;
            }

            var str = "";

            while ( tmpR <=5 && tmpC >= 0 ) {

                var tmpPos = ( tmpR * 7 ) + tmpC;

                tmpR += 1;
                tmpC += -1;

                str += this.grid [tmpPos].resident.toString();

            }

            return str;

        }
        
    });

    var Intro = new Phaser.Class({

        Extends: Phaser.Scene,
    
        initialize:
    
        function Intro ()
        {
            Phaser.Scene.call(this, { key: 'Intro' });
        },
        preload : function () 
        {

            this.load.audioSprite('sfx', 'client/assets/sfx/fx_mixdown.json', [
                'client/assets/sfx/sfx.ogg',
                'client/assets/sfx/sfx.mp3'
            ]);
            this.load.audio ('bgsound', [ 'client/assets/sfx/drumsofwar.ogg', 'client/assets/sfx/drumsofwar.mp3'] );

            this.load.image ('bgimage', 'client/assets/images/bg.png');

            this.load.image ('title', 'client/assets/images/title.png');

            this.load.image ('center_img', 'client/assets/images/center.png');

            this.load.image ('pwin', 'client/assets/images/prompt_win.png');

            this.load.image ('indicator_bg', 'client/assets/images/indicator_bg.png');

            this.load.image ('bg_img1', 'client/assets/images/scenea_bg.png');
            

            this.load.spritesheet('indicator_turn', 'client/assets/images/indicator_turn.png', { frameWidth: 53, frameHeight: 53 });

            this.load.spritesheet('thumbs', 'client/assets/images/spritesheet1.png', { frameWidth: 50, frameHeight: 50 });

            this.load.spritesheet('menu_intro', 'client/assets/images/menu_intro.png', { frameWidth: 260, frameHeight: 260 });

            this.load.spritesheet('circles', 'client/assets/images/circles.png', { frameWidth: 100, frameHeight: 100 });

            this.load.on('progress', function (value) {
                var perc = Math.floor ( value * 100 );
                //console.log ( perc );
            });

        },
        create : function () {

            var bg = this.add.image ( _gameW/2, _gameH/2, 'bgimage').setScale(_xscale);

            var bg2 = this.add.image ( _gameW/2, _gameH/2, 'bg_img1').setScale(_xscale);

            var title = this.add.image ( _gameW/2, _gameH/2, 'title').setScale(_xscale);


            //init menu...
            var strX = 380 * _xscale,
                strY = 410 * _yscale,
                strS = 260 * _xscale;

            var _this = this;

            for ( var i = 0; i < 3; i++ ) {

                var menue = this.add.image ( strX + i*(strS), strY + _gameW/2, 'menu_intro', i*2 ).setData ('frame', i).setInteractive();

                menue.on ('pointerover', function () {
                    this.setFrame ( (this.getData('frame') * 2) + 1 );
                });
                menue.on ('pointerout', function () {
                    this.setFrame ( this.getData('frame') * 2 );
                });
                menue.on('pointerdown', function () {
                    //console.log ('clicked')
                    _this.scene.start('sceneA')
                });

                this.tweens.add ({
                    targets : menue,
                    y : strY ,
                    duration : 400,
                    ease : 'Power2',
                    delay : i * 50
                });

            }

            
        }
    });

    //CLASSES
    var PlayerIndicator = new Phaser.Class({
    
        Extends: Phaser.GameObjects.Container,
    
        initialize:
    
        function PlayerIndicator ( scene, id, x, y, width, height, name )
        {
            Phaser.GameObjects.Container.call(this, scene)
    
            this.setPosition(x, y).setSize(width, height);
    
            this.id = id;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.name = name;
    
            this.top = -height/2, 
            this.left = -width/2;

            this.rect = scene.add.rectangle (0, 0,width, height, 0xffffff, 0.1 )

            this.bg = scene.add.image (0, 0, 'indicator_bg');

            this.turn_ind = scene.add.image ( -width*0.38, 0, 'indicator_turn', );

            var nameTxt = { 
                fontFamily: 'Poppins', 
                fontSize: this.height *0.25, 
                color: '#f3f3f3' 
            };

            this.name_txt = scene.add.text ( -width*.29, 0, name, nameTxt ).setOrigin(0, 0.5);
            //this.text.setShadow( 2, 2, '#9c9c9c', 5, true, true );

            var timeTxt = { 
                fontFamily: 'Poppins', 
                fontSize: this.height *0.2, 
                color: '#f3f3f3' 
            };

            this.time_txt = scene.add.text ( width*.41, height*0.02, '15s', timeTxt ).setOrigin(1, 0);

            var winTxt = { 
                fontFamily: 'Poppins', 
                fontSize: this.height *0.2, 
                color: '#f3f3f3' 
            };

            this.win_txt = scene.add.text ( width*.41 , -height*0.3, '0 wins', winTxt ).setOrigin(1, 0);
            
            //add elements fo container..
            this.add ([ this.rect, this.bg, this.turn_ind, this.name_txt, this.win_txt, this.time_txt ]);

            //add to scene...
            scene.children.add ( this ); 
            
        }
    
    });
    
    //get game width & height..
    var parentDiv = document.getElementById('game_div');

    var _gameW = parentDiv.clientWidth,
        _gameH = parentDiv.clientHeight,
        _xscale = _gameW/1280,
        _yscale = _gameH/720;

    console.log ( _gameW, _gameH );

    //game config...
    var config = {

        type: Phaser.AUTO,
        width: _gameW,
        height: _gameH,
        backgroundColor: '#dedede',
        audio: {
            disableWebAudio: false
        },
        parent:'game_div',
        scene: [ Intro, SceneA ]

    };

    var game = new Phaser.Game(config);

}

    







