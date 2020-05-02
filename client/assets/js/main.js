
/* 
- Author : Charlou Nicolas.
-
-
*/


   
window.onload = function () {

    var game, config, socket;

    var _gameW = 0, _gameH = 0;

    var _scale = 0;
    
    var username = document.getElementById('username');

    username.value = 'Player' + Math.floor( Math.random() * 99999 );

    var btn = document.getElementById ('btnEnter');    

    var form = document.getElementById ('myForm');

    form.onsubmit = function ( e ) {

        e.preventDefault();

        document.getElementById('game_login').style.display = 'none';
        document.getElementById('game_div').style.display = 'block';
        
        enterGame ();
        
    }

    readDeviceOrientation();

    this.addEventListener("orientationchange", function() {
        readDeviceOrientation()
    });

    function readDeviceOrientation () {


        if ( window.orientation == undefined  ) return;

        var landscape = Math.abs ( window.orientation) == 0;

        var btn_enter =  document.getElementById('btnEnter');

        btn_enter.disabled = ( landscape ) ? true : false; 

        var message_div =  document.getElementById('messageDiv');

        message_div.innerHTML = ( !landscape ) ? '' : '<small>Please set device orientation to landscape.</small>';

    }

    function enterGame () {

        var maxW = 1280;

        var container = document.getElementById('game_container');

        var contW = container.clientWidth,
            contH = container.clientHeight;

        var tmpWidth = contW > maxW ? maxW : contW,
            tmpHeight = Math.ceil(tmpWidth * 9/16);

        if ( tmpHeight >= contH ) {

            gameH = contH;
            gameW = Math.ceil(gameH * 16/9);
            //console.log ( 'game dimensions adjusted by screen height' )

        }else {

            gameW = tmpWidth;
            gameH = tmpHeight;
            //console.log ( 'game dimensions adjusted by screen width' )
        }

        _gameW = gameW;
        _gameH = gameH;

        _scale = _gameW/1280;

        var game_div = document.getElementById('game_div');
        game_div.style.width = gameW + 'px';
        game_div.style.height = gameH + 'px';
     
        config = {

            type: Phaser.AUTO,
            width: gameW,
            height: gameH,
            backgroundColor: '#dedede',
            audio: {
                disableWebAudio: false
            },
            parent:'game_div',
            scene: [ Intro, SceneA ]

        };

        game = new Phaser.Game(config);

        socket = io();
        
        socket.emit ('initUser', username.value );

    }


    //SCENES..
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

            this.load.spritesheet('prompt_btns', 'client/assets/images/prompt_btns.png', { frameWidth: 172, frameHeight: 52 });
            

            this.load.spritesheet('thumbs', 'client/assets/images/spritesheet1.png', { frameWidth: 50, frameHeight: 50 });

            this.load.spritesheet('menu_intro', 'client/assets/images/menu_intro.png', { frameWidth: 260, frameHeight: 260 });

            this.load.spritesheet('circles', 'client/assets/images/circles.png', { frameWidth: 100, frameHeight: 100 });

            this.load.on('progress', function (value) {
                var perc = Math.floor ( value * 100 );
                //console.log ( perc );
            });

        },
        create : function () {

            this.createInterface ();
 
        },
        createInterface : function () {

            var bg = this.add.image ( _gameW/2, _gameH/2, 'bgimage').setScale(_scale);

            var bg2 = this.add.image ( _gameW/2, _gameH/2, 'bg_img1').setScale(_scale);

            var title = this.add.image ( _gameW/2, _gameH/2, 'title').setScale(_scale);


            //init menu...
            var strX = 380 * _scale,
                strY = 410 * _scale,
                strS = 260 * _scale;

            var _this = this;

            for ( var i = 0; i < 3; i++ ) {

                var menue = this.add.image ( strX + i*(strS), strY + _gameW/2, 'menu_intro', i*2 ).setScale(_scale).setData ('frame', i).setInteractive();

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
                    easeParams : [1, 0.8],
                    ease : 'Elastic',
                    delay : i * 100
                });

            }
        }
        
    });

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

            this.turn = 0;

            this.createMusicAndSound();

            this.createGraphics();

            this.createPlayers();
            
            this.createIndicators();

            this.initGame ();

        },
        createMusicAndSound : function () {
            
            this.music = this.sound.addAudioSprite('sfx').setVolume (0.8);

        },
        createGraphics : function () {

            
            var _this = this;

            

            //add background img
            var bg = this.add.image ( _gameW/2, _gameH/2, 'bgimage').setScale(_scale);

            //add the holes bg..
            var bgCenter = this.add.image ( _gameW/2, _gameH/2, 'center_img').setScale(_scale);


            //create holes and grid...

            this.rects = [];

            var bs = Math.floor ( 100 * _scale ),
                bx = (_gameW - (7 * bs))/2,
                by = Math.floor ( 100 * _scale );


            for ( var i = 0; i < 42; i++ ) {

                var ix = Math.floor ( i / 7 ),
                    iy = i % 7;

                var xp = bx + (iy * bs) + bs/2,
                    yp = by + (ix * bs) + bs/2;

                var cbg = this.add.image ( xp, yp, 'circles', 3 ).setScale(_scale);

                var rect = this.add.image ( xp, yp, 'circles', 0 ).setScale(_scale).setDepth(999);

                var circ = this.add.circle ( xp, yp, bs*0.383, 0xcecece, 0 );

                //var txt = this.add.text ( xp, yp, i, { color : 'red', fontSize : bs *0.3, fontFamily : 'Arial'}).setOrigin(0.5);

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

            //this is to create columns clickable..
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
                    
                    if ( !_this.isGameOn || _this.turn == 1 ) return;

                    var deep = _this.getDeep( this.getData('cnt') );

                    if ( deep != null ) {

                        _this.music.play ('clickb', { volume : 0.8 });

                        _this.createCircle ( deep );


                    }else {

                        _this.music.play ('error', { volume : 0.3 });
                    }
                    
                });

            }


        },
        createPlayers : function () {

            var isAi = true;

            var playerNames = ['Rose™', 'Jack™', 'Mandy™', 'Rei™', 'Mika™', 'Ely™', 'Marlou™', 'Spencer™', 'Denver™' ];

            var oppName = playerNames [ Math.floor (Math.random() * playerNames.length ) ];

            this.playerArr = [
                { 'id' : 'self', 'name' : 'Chal', 'w' : 0, 'l': 0,  'ai':false },
                { 'id' : 'oppo', 'name' : oppName, 'w' : 0, 'l' : 0, 'ai':isAi }
            ];

        },
        createIndicators : function () {

            
            
            this.indicators = [];

            var sW = 350 * _scale,
                sH = 80 * _scale;
                sS = sW * 0.05, 
                sX = (_gameW - (2 * ( sW + sS ) - sS) )/2,
                sY = 8 * _scale;

            var txtConfig = { fontFamily: 'Poppins', color: '#f3f3f3', fontSize : sH * 0.25 };


            for ( var i = 0; i < 2; i++ ) {

                var xp = sX + i * (sW+sS),
                    yp = sY;

                var miniContainer = this.add.container (xp, yp).setName ( this.playerArr[i].id );

                var indBG = this.add.image (0, 0, 'indicator_bg').setScale(_scale).setOrigin (0);

                var turn_ind = this.add.image ( sW * 0.12, sH/2, 'indicator_turn', ).setScale(_scale).setName('turnInd');;

                var name_txt = this.add.text ( sW * 0.21, sH/2, this.playerArr[i].name, txtConfig ).setOrigin(0, 0.5).setName('nameTxt');
            
                var win_txt = this.add.text ( sW * 0.92, sH * 0.18, 'Wins : 0', txtConfig ).setFontSize( sH*0.22 ).setOrigin(1, 0).setName('winTxt');
                
                var tim_txt = this.add.text ( sW * 0.92, sH * 0.6, '60s', txtConfig ).setFontSize( sH*0.22 ).setOrigin(1, 0).setName('timeTxt');

              
                miniContainer.add ([ indBG, turn_ind, name_txt, tim_txt, win_txt ]);

                this.indicators.push (miniContainer);

            }
            



        },
        createMyMask : function () {

            this.shape = this.make.graphics();
            
            this.shape.fillStyle(0xff33ff);
            
            this.shape.beginPath();

            this.shape.fillRect ( 263, 100, 755, 616 );

            this.masker = this.shape.createGeometryMask();

            

        },
        createCircle : function ( deep ) {

            var bs = Math.floor ( 116 * _scale );

            var xp = this.grid [deep].x,
                yp = this.grid [deep].y;

            var frame = this.turn == 0 ? 1 : 2;

            var circ = this.add.image ( xp, _gameH *0.08, 'circles', frame ).setScale (_scale );

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

            this.circles.push ( circ );

            this.grid [deep].isTaken  = true;
            this.grid [deep].resident  = this.turn;

            this.checkWin ( this.turn, deep );            

        },
        initGame : function () {

            this. makeTurn ( this.turn );

        },
        makeTurn : function () {

            var oppTurn = this.turn == 0 ? 1 : 0;

            this.indicators[ oppTurn ].getByName ('turnInd').setFrame ( 0 );

            this.indicators[ this.turn ].getByName ('turnInd').setFrame ( 1 );

            if ( this.playerArr[ this.turn ].ai ) this.aiPick ();

        },
        switchTurn : function () {

            console.log ('switch turn');

            this.turn = this.turn == 0 ? 1 : 0;

            this.makeTurn ();

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

            var win = verStr.includes (tempStr) || horStr.includes (tempStr) || bacStr.includes (tempStr) || forStr.includes (tempStr) ;

            if ( win ) {
                this.gameWinner ();
            }else {
                this.switchTurn ();
            } 
                
        },
        gameWinner : function () {

            this.isGameOn = false;

            this.playerArr[this.turn].w += 1;

            this.indicators [this.turn].getByName ('winTxt').text = 'Wins : ' + this.playerArr[this.turn].w;

            var txt = ( this.turn == 0 ) ? 'Congratulations! You Win' : 'Sorry, You Lose';

            var _this = this;

            setTimeout(() => {
                _this.music.play ('warp');
                _this.showEndPrompt (txt);
            }, 500 );
            

        },
        
        showEndPrompt : function ( txt ) {

            var _this = this;


            this.endContainer = this.add.container (0, _gameH).setDepth(999);

            var img = this.add.image (0, 0, 'pwin').setScale(_scale).setInteractive().setOrigin (0);

            var txtConfig = {
                color : '#000',
                fontSize : 20 * _scale,
                fontFamily : 'Verdana'
            }

            var txt = this.add.text ( _gameW/2, _gameH * 0.485, txt , txtConfig ).setOrigin(0.5);


            var btns = this.add.sprite ( _gameW/2, _gameH * 0.57, 'prompt_btns', 0 ).setInteractive ();

            btns.on('pointerover', function () {
                this.setFrame (1);
            });
            btns.on('pointerout', function () {
                this.setFrame (0);
            });
            btns.on('pointerup', function () {
                this.setFrame (1);
            });
            btns.on('pointerdown', function () {
                
                _this.music.play ('beep', { volume : 0.5});

                _this.resetGame ();
            });
            
            this.endContainer.add ([img, txt, btns])

            this.tweens.add ({
                targets : this.endContainer,
                y : 0,
                duration : 500,
                easeParams : [1, 0.5],
                ease : 'Elastic'
            });


        },
        removeEndPrompt : function () {
            this.endContainer.destroy();
        },
        resetGame : function () {
            
            this.removeEndPrompt ();

            for ( var i in this.circles ) {
                this.circles [i].destroy();
            }
            for ( var j in this.grid ) {
                this.grid [j].isTaken = false;
                this.grid [j].resident = '-';
            }

            this.isGameOn = true;

            this.turn = this.turn == 0 ? 1 : 0;

            this.initGame ();

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

        },
        aiPick : function () {

            var arr = [];

            for ( var i in this.grid ) {
                if ( !this.grid [i].isTaken ) arr.push ( i );
            }

            var rp = Math.floor ( Math.random () * arr.length );

            var col = arr[rp] % 7;

            //console.log ( 'ai', arr[rp], col );

            var deep = this.getDeep ( col );

            var _this = this;

            setTimeout(() => {
                _this.createCircle ( deep );
                _this.music.play ('clickb', { volume: 0.8})
            }, 500 );
            

        }

        
    });




} 
