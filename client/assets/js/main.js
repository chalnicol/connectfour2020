
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
            this.load.audio ('bgsound2', [ 'client/assets/sfx/bgsound.ogg', 'client/assets/sfx/bgsound.mp3'] );

            this.load.audio ('bgsound', [ 'client/assets/sfx/bgsound2.ogg', 'client/assets/sfx/bgsound2.mp3'] );

            this.load.image ('bgimage', 'client/assets/images/bg.png');

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

            this.add.text ( _gameW/2, _gameH * 0.9, '@chalnicol', { color:'gray', fontFamily:'Oswald', fontSize:15*_scale }).setOrigin(0.5);
            
            this.loadTxt =  this.add.text ( _gameW/2, _gameH * 0.45, 'Loading Files : 0%', { color:'#3a3a3a', fontFamily:'Oswald', fontSize:25*_scale }).setOrigin(0.5);

            this.load.on('progress', function (value) {
                var perc = Math.floor ( value * 100 );
                this.scene.loadTxt.text = 'Loading Files : ' + perc + '%'; 
            });

        },
        create : function () {

            this.isSetGame = false;

            this.initSound();
            
            this.initSocketIOListeners();

            this.initInterface ();
            
            setTimeout ( function () {
                socket.emit ('getInitData');
            }, 500 ); 

        },
        initSocketIOListeners () {

            //console.log ('listeners loaded');

            var _this = this;

            socket.on ('pairInvite', function ( data ) {
                
                if ( _this.connectScreenShown ) _this.removeConnectScreen();

                setTimeout ( function () {
                    _this.showInviteScreen ( data );
                }, 100 );
                
            });
            socket.on ('pairingError', function ( data ) {
            
                if ( _this.isPrompted ) _this.removePrompt ();

                var err = "";

                if ( data.error == 0 ) {
                    err = 'Pairing unsuccessful.';
                }else if ( data.error == 1 ) {
                    err = 'Pairing ID error.';
                }else {
                    err = 'Game does not exist anymore.';
                }

                _this.showPromptScreen ( 'error', err );

            
            });
            socket.on ('sendInitData', function ( data ) {

                _this.music.play ('message');

                _this.playersPairID.text = 'Pairing ID : ' + data.pid;

                _this.playersOnlineTxt.text = 'Players Online : ' + data.count;

            });
            socket.on ('initGame', function ( data ) {
                _this.isSetGame = true;
                setTimeout ( function () {
                    _this.initGame (data);
                }, 300 );
            });
            socket.on ('playersOnline', function ( data ) {
            
                _this.music.play ('message');

                _this.playersOnlineTxt.text = 'Players Online : ' + data;

            });


        },
        initSound : function () {
            

            this.bgsound = this.sound.add ('bgsound').setVolume(0.2).setLoop(true);
            this.bgsound.play();

            this.music = this.sound.addAudioSprite('sfx');

        },
        initInterface : function () {

            var bg = this.add.image ( _gameW/2, _gameH/2, 'bgimage').setScale(_scale);

            var bg2 = this.add.image ( _gameW/2, _gameH/2, 'bg_img1').setScale(_scale);

            var title = this.add.image ( _gameW/2, _gameH/2, 'title').setScale(_scale);

            //profile

            
            var txtConfig = { color:'#000', fontSize:30*_scale, fontFamily:'Oswald'};

            this.playerName = this.add.text ( 104*_scale, 28*_scale, username.value, txtConfig ).setOrigin (0);

            var txtConfig1 = { color:'#7d7d7d', fontSize:20*_scale, fontFamily:'Oswald'};

            this.playersPairID = this.add.text ( 104*_scale, 64*_scale, 'Pairing ID : --', txtConfig1 ).setOrigin (0);
            
            var txtConfig2 = { color:'#cc4300', fontSize:20*_scale, fontFamily:'Oswald'};
            
            this.playersOnlineTxt = this.add.text ( 33*_scale, 110*_scale, 'Player Online : --', txtConfig2 ).setOrigin (0);
            


            //menu...
            var strX = 380 * _scale,
                strY = 410 * _scale,
                strS = 260 * _scale;

            var mW = 235 * _scale;

            for ( var i = 0; i < 3; i++ ) {


                var miniContainer = this.add.container ( strX + i*(strS), strY + _gameW/2 ).setSize (mW, mW).setData ('id', i).setInteractive();;

                var menue = this.add.image ( 0, 0, 'menu_intro', i ).setScale(_scale);

                miniContainer.add ( menue );

                miniContainer.on ('pointerover', function () {

                    var clr;

                    switch ( this.getData ('id') ) {
                        case 0 : 
                            clr = 0x99ff99;
                        break;
                        case 1 : 
                            clr = 0x00ffff;
                        break;
                        case 2 : 
                            clr = 0xffff99;
                        break;
                        default :
                    }

                    this.getAt ( 0 ).setTint ( clr );
                });
                miniContainer.on ('pointerout', function () {
                    this.getAt ( 0 ).clearTint ();
                });
                miniContainer.on('pointerdown', function () {
                    //console.log ('clicked')
                    this.scene.music.play ('clicka');

                    this.scene.menuClick (this.getData('id'));
                    
                });

                

                this.tweens.add ({
                    targets : miniContainer,
                    y : strY ,
                    duration : 600,
                    easeParams : [1, 0.8],
                    ease : 'Elastic',
                    delay : i * 100
                });

            }
        },
        menuClick : function ( id ) {

            if ( this.isSetGame ) return;

            switch (id) {
                case 0 : 

                    var toSendData = {
                        'isSinglePlayer' : true,
                        'isChoosingOpponent' : false,
                        'isTimed' : false
                    }

                    socket.emit ('enterGame', toSendData );

                    this.showWaitScreen ();

                break;
                case 1 : 

                    var toSendData = {
                        'isSinglePlayer' : false,
                        'isChoosingOpponent' : true,
                        'isTimed' : false
                    }
                    
                    socket.emit ('enterGame', toSendData );

                    this.showPromptScreen ( 'connect' );

                break;
                case 2 : 
                    this.showConnectToFriendScreen();

                break;
                default:
            }

        },
        showWaitScreen : function () {

            var _this = this;

            this.isPrompted = true;

            this.rectBg = this.add.rectangle ( 0, 0, _gameW, _gameH, 0x000000, 0.7 ).setOrigin(0).setInteractive();

            this.promptScreen = this.add.container (0, _gameH/2).setDepth(999);

            var window = this.add.image ( 0, 0, 'prompt' ).setOrigin ( 0 ).setScale( _gameW/1280 );

            var yp = Math.floor ( 300 * _gameH/720 );

           
            var img0 = this.add.image ( _gameW/2, yp, 'circ0', 0 ).setScale( _gameW/1280 ).setRotation ( Math.PI/180 * (Math.random() * 360) );

            var img1 = this.add.image ( _gameW/2, yp, 'circ0', 1).setScale( _gameW/1280 ).setRotation ( Math.PI/180 * (Math.random() * 360 ));;

            var img2 = this.add.image ( _gameW/2, yp, 'circ0', 2).setScale( _gameW/1280 ).setRotation ( Math.PI/180 * (Math.random() * 360) );;

            var txtConfig = { 
                color:'#3a3a3a', 
                fontSize: Math.floor ( 30 * _gameH/720 ),
                fontFamily : 'Oswald'
            };

            var txtp = Math.floor ( 380 * _gameH/720);

            var txt = this.add.text ( _gameW/2, txtp, 'Please Wait..', txtConfig ).setOrigin(0.5);

            this.promptScreen.add ([window, img0, img1, img2, txt ]);

            this.tweens.add ({
                targets : img0,
                duration : 3000,
                rotation : '+=10',
                repeat : -1,
                yoyo : true,
                ease : 'Quad.easeIn'
            });
            this.tweens.add ({
                targets : img1,
                duration : 3000,
                rotation : '-=8',
                repeat : -1,
                yoyo : true,
                ease : 'Quad.easeIn'
            });
            this.tweens.add ({
                targets : img2,
                duration : 3000,
                rotation : '+=5',
                repeat : -1,
                yoyo : true,
                ease : 'Quad.easeIn'
            });
            this.tweens.add ({
                targets : this.promptScreen,
                y : 0,
                duration : 300,
                easeParams : [0, 1.5],
                ease : 'Elastic'
            });

        },
        showPromptScreen : function ( promptType, err='' ) {

            var _this = this;

            this.isPrompted = true;

            this.rectBg = this.add.rectangle ( 0, 0, _gameW, _gameH, 0x000000, 0.7 ).setOrigin(0).setInteractive();

            this.promptScreen = this.add.container (0, _gameH/2).setDepth(999);

            //476 x 225 

            var window = this.add.image ( 0, 0, 'prompt' ).setOrigin ( 0 ).setScale( _gameW/1280 );

            var bx = _gameW/2,
                by = _gameH * 0.525;

            var txtx = _gameW/2,
                txty = _gameH * 0.385,
                txtH = Math.floor ( 32 * _gameH/720 );

            var str = ( promptType == 'connect') ? 'Connecting..' : err ;

            var txtConfig = { 
                color:'#746a62', 
                fontSize: txtH,
                fontFamily : 'Oswald'
            };

            var txt = this.add.text ( txtx, txty, str, txtConfig ).setOrigin(0.5);

            this.promptScreen.add ([window, txt]);

            var btn_id = "", frame = 0;

            if ( promptType == 'connect')
            {
                var max = 5;

                var bSize = Math.floor ( 25 * _gameW/1280 ),
                    bSpace = Math.floor ( 3 * _gameW/1280 ),
                    bTotal = max * ( bSize + bSpace ) - bSpace;
                    cX = (_gameW - bTotal) /2,
                    cY = _gameH * 0.45;

                    
                var duration = 500, delay = duration/max;

                for ( var i=0; i<max; i++) {

                    var circ = this.add.circle ( cX + ( i*( bSize + bSpace) ) + (bSize/2), cY, bSize/2, 0x6c6c6c, 1 );
            
                    this.tweens.add ({
                        targets : circ,
                        scaleX : 0.5,
                        scaleY : 0.5,
                        duration : duration,
                        ease : 'Power2',
                        repeat : -1,
                        yoyo : true,
                        delay : i * delay,
                    });

                    this.promptScreen.add (circ);

                }
                
                btn_id = 'cancel';
                btn_fr = 0;

            }else {

                btn_id = 'confirm';
                btn_fr = 2;

            }        

            var btn = this.add.image ( bx, by, 'prompt_btns', btn_fr ).setScale( _gameW/1280 ).setData({'frame': btn_fr, 'id' : btn_id}).setOrigin(0.5).setInteractive();
    
            btn.on('pointerover', function () {
                this.setFrame ( this.getData('frame') + 1 );
            });
            btn.on('pointerout', function () {
                this.setFrame ( this.getData('frame')  );
            });
            btn.on('pointerdown', function () {
                
                if ( _this.isSetGame ) return;

                if ( this.getData('id') == 'cancel') socket.emit ('leaveGame');

                _this.music.play ('clicka');

                _this.removePrompt ();

            });
            this.promptScreen.add (btn);

            this.tweens.add ({
                targets : this.promptScreen,
                y : 0,
                duration : 300,
                easeParams : [0, 1.5],
                ease : 'Elastic'
            });

        },
        showInviteScreen : function ( data ) {

            var _this = this;

            this.isPrompted = true;

            this.rectBg = this.add.rectangle ( 0, 0, _gameW, _gameH, 0x000000, 0.7 ).setOrigin(0).setInteractive();

            this.promptScreen = this.add.container (0, _gameH/2).setDepth(999);

            var window = this.add.image ( 0, 0, 'invite' ).setScale(_gameW/1280).setOrigin ( 0 );
            
            var txtH = Math.floor ( 28 * _gameW/1280 ),
                txtX = Math.floor ( 640 * _gameW/1280 ),
                txtY = Math.floor ( 265 * _gameH/720 );

            var textNameConfig = { 
                color:'#9c5825', 
                fontSize: txtH,
                fontFamily : 'Oswald'
            };
            
            var gameType = data.isTimed ? 'Blitz' : 'Classic';

            var str = data.invite + ' has Invited you to a "'+ gameType +'" game.';

            var textName = this.add.text ( txtX, txtY, str, textNameConfig ).setOrigin(0.5, 0);


            this.promptScreen.add ([ window, textName]);

            var dataArr = [{ id : 'accept', frame : 4 }, { id : 'reject', frame : 6 } ];

            var _this = this;
            
            var btw = Math.floor ( 224 * _gameW/1280 ),
                bts = btw * 0.1,
                btx = (_gameW - ((btw * 2) + bts))/2 + btw/2,
                bty = Math.floor ( 360 * _gameH/720 );
                
            for ( var i = 0; i < dataArr.length; i++ ) {

                var btn = this.add.image ( btx + i * (btw + bts), bty, 'prompt_btns', dataArr[i].frame ).setScale (_gameW/1280).setData ( dataArr[i] ).setInteractive();
                
                btn.on ('pointerdown', function() {
                    //_this.playSound('clicka');
                    //_this.promptBtnsClick ( this.getData('id') );
                    socket.emit ( 'pairingResponse',  this.getData('id') == 'accept' );

                    _this.music.play('clicka');

                    _this.removePrompt ();


                });
                btn.on ('pointerover', function() {
                    this.setFrame ( this.getData('frame') + 1 );
                });
                btn.on ('pointerup', function() {
                    this.setFrame ( this.getData('frame') );
                });
                btn.on ('pointerout', function() {
                    this.setFrame ( this.getData('frame'));
                });

                this.promptScreen.add ( btn );

            }

            this.tweens.add ({
                targets : this.promptScreen,
                y : 0,
                duration : 300,
                easeParams : [0, 1.5],
                ease : 'Elastic'
            });
            
            

            

        },
        showConnectToFriendScreen : function () {

            var _this = this;
            
            this.connectScreenShown = true;

            this.rectBg = this.add.rectangle ( 0, 0, _gameW, _gameH, 0x000000, 0.7 ).setOrigin(0).setInteractive();

            this.connectScreen = this.add.container (0,_gameH).setDepth (999);

            var rX = Math.floor ( 809 * _gameW/1280 ),
                rY = Math.floor ( 122 * _gameH/720 ),
                rz = Math.floor ( 62 * _gameW/1280 );

            var rectUnder = this.add.rectangle ( rX, rY, rz, rz ).setInteractive();

            rectUnder.on ('pointerdown', function () {
                
                _this.music.play ('clicka');
                _this.removeConnectScreen ();

            });


            var window = this.add.image (0, 0, 'pairing_img' ).setOrigin ( 0 ).setScale(_gameW/1280);

            var txtH = Math.floor ( 56 * _gameH/720 );
            var txtConfig = { 
                color:'#4e4e4e', 
                fontSize: txtH, 
                fontFamily:'Oswald', 
            };

            var txtX = Math.floor ( 780 * _gameW/1280 ),
                txtY = Math.floor ( 180 * _gameH/720 );

            var txt = this.add.text (txtX, txtY, '0', txtConfig ).setOrigin (1, 0);

            this.connectScreen.add ([ rectUnder, window, txt ]);

            var inputCount = 0, maxInput = 6;

            var xW = Math.floor ( 105 * _gameW/1280 ),
                xH = Math.floor ( 83 * _gameW/1280 ),
                xSp = Math.floor ( 3 * _gameW/1280 ),

                xStart =  ((_gameW - ((3 * (xW + xSp)) - xSp))/2) + xW/2,
                //xStart =  Math.floor ( 482 * _gameW/1280 ),
                yStart =  Math.floor ( 305 * _gameW/1280 );

            var keysVal = [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'clr', 'ok' ];

            for ( var i = 0; i < 12; i++ ) {

                var ix = Math.floor ( i/3 ), iy = i%3;

                var xs = xStart + iy * (xW + xSp),
                    ys = yStart + ix *( xH + xSp );

                var keys = this.add.image ( xs, ys, 'keys' ).setScale(_gameW/1280).setData('id', i).setInteractive();

                keys.on('pointerover', function () {
                    this.setFrame (1);
                });
                keys.on('pointerout', function () {
                    this.setFrame (0);
                });
                keys.on('pointerup', function () {
                    this.setFrame (0);
                });
                keys.on('pointerdown', function () {
                
                   this.setFrame (2);

                    var data = this.getData('id');

                    if ( data < 10 ) {

                        if ( inputCount < maxInput ) {

                            //this.setFrame ( data + 12 );

                            if ( inputCount == 0 ) txt.text = '';

                            if ( data == 9 ) {
                                txt.text += '0'
                            }else {
                                txt.text += (data + 1) ;
                            }
                           
                            inputCount++;

                            _this.music.play('clicka');


                        }else {
                            _this.music.play('error');
                        }


                    }else if ( data == 10 ) {

                        txt.text = '0';
                        inputCount = 0;
                        //this.setFrame ( this.getData('frame') + 12 );

                        _this.music.play('clicka');

                    }else {

                        if ( inputCount > 0 ) {

                            //this.setFrame ( this.getData('frame') + 12 );

                            _this.music.play('clicka');
                            
                            _this.removeConnectScreen ();

                            _this.showPromptScreen ('connect');

                            socket.emit ('pair', { 'code' : txt.text, 'isTimed' : false } );

                        }else {
                            _this.music.play('error');
                        }

    
                    }
                
                });

                //add texts..
                var txts = this.add.text ( xs, ys, keysVal[i], { color : '#3a3a3a', fontSize: xH * 0.4, fontFamily : 'Oswald' }).setOrigin(0.5);

                this.connectScreen.add ( [keys, txts] );

            }

            this.tweens.add ({
                targets : this.connectScreen,
                y : 0,
                duration : 300,
                easeParams : [0, 1.5],
                ease : 'Elastic'
            });



        },
        removePrompt : function () {

            this.isPrompted = false;
            
            this.promptScreen.destroy ();
            
            this.rectBg.destroy();


        },
        removeConnectScreen : function () {

            this.connectScreenShown = false;

            this.connectScreen.destroy ();

            this.rectBg.destroy();
            
        },
        initGame : function ( data ) {

            socket.removeAllListeners();

            this.bgsound.stop();

            this.scene.start('sceneA', data );

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
        create : function ( data ) {

            this.initData = data;

            this.grid = [];

            this.isGameOn = true;

            this.circles = [];

            this.turn =  ( this.initData.isSinglePlayer ) ? 0 : this.initData.turn;

            this.initSocketIOListeners();

            this.createMusicAndSound();

            this.createGraphics();

            this.createPlayers();
            
            this.createIndicators();

            this.createControls();

            this.initGame ();

        },
        initSocketIOListeners : function () {

            var _this = this;

            socket.on ('showEmoji', function ( data ) {

                _this.showSendEmojiScreen (false);

                _this.playSound('message');

                _this.showSentEmojis ( data.frame, data.plyr );

            });
            socket.on ('sendMoveToOpponent', function ( data ) {

                //console.log (data);

                _this.playSound ('clickb', 0.8 );

                _this.createCircle ( data );
                
                _this.analyzeMove ( data );

            });
            socket.on ('opponentLeft', function ( data ) {

                _this.removePrompt ();

                _this.playSound ('warp');

                _this.showPromptSmall ('Opponent has left the game.' );
                
            });
            socket.on("resetGame", function () {
            
                setTimeout (function () {
                    _this.resetGame();
                }, 500 )
                
            });
            socket.on ('timeRanOut', function ( data ) {

                _this.playSound ('alarm');

                _this.playerTimeRanOut = true;

            });
            
        },
        createMusicAndSound : function () {
            
            this.bgsound = this.sound.add ('bgsound2').setVolume(0.2).setLoop(true);
            this.bgsound.play();

            this.soundOn = true;

            this.music = this.sound.addAudioSprite('sfx');
            
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

                        _this.playSound ('clickb', 0.8 );

                        _this.createCircle ( deep );

                        if ( !_this.initData.isSinglePlayer ) socket.emit ('playerMove', deep );
                        
                        _this.analyzeMove ( deep );          
                        

                    }else {

                        _this.playSound ('error', 0.3 );

                    }
                    
                });

            }

        },
        createPlayers : function () {

            //console.log ( this.initData );

            var selfName = this.initData.players.self.name;
            
            var oppoName = "";

            var isAi = false;

            var clr0 = 0, clr1 = 1;


            if ( this.initData.isSinglePlayer ) {

                var playerNames = ['Rose™', 'Jack™', 'Mandy™', 'Rei™', 'Mika™', 'Ely™', 'Marlou™', 'Spencer™', 'Denver™' ];

                oppoName = playerNames [ Math.floor (Math.random() * playerNames.length ) ];

                isAi = true;

            }else {

                clr0 = this.initData.players.self.clr;

                clr1 = clr0 == 0 ? 1 : 0;

                oppoName = this.initData.players.oppo.name;  
                
            }
            
            this.playerArr = [
                { 'id' : 'self', 'name' : selfName, 'w' : 0, 'chipClr': clr0, 'ai':false },
                { 'id' : 'oppo', 'name' : oppoName, 'w' : 0, 'chipClr': clr1, 'ai':isAi }
            ];
            
            //..
        },
        createIndicators : function () {

            
            
            this.indicators = [];

            var sW = 350 * _scale,
                sH = 80 * _scale;
                sS = sW * 0.02, 
                sX = (_gameW - (2 * ( sW + sS ) - sS) )/2,
                sY = 5 * _scale;

            var txtConfig = { fontFamily: 'Poppins', color: '#f3f3f3', fontSize : sH * 0.25 };


            for ( var i = 0; i < 2; i++ ) {

                var xp = sX + i * (sW+sS),
                    yp = sY;

                var miniContainer = this.add.container (xp, yp).setName ( this.playerArr[i].id );

                var indBG = this.add.image (0, 0, 'indicator_bg').setScale(_scale).setOrigin (0);

                var turn_ind = this.add.image ( sW * 0.12, sH/2, 'indicator_turn', ).setScale(_scale).setName('turnInd');;

                var name_txt = this.add.text ( sW * 0.21, sH/2, this.playerArr[i].name, txtConfig ).setOrigin(0, 0.5).setName('nameTxt');
            
                var win_txt = this.add.text ( sW * 0.92, sH * 0.18, 'Wins : 0', txtConfig ).setFontSize( sH*0.22 ).setOrigin(1, 0).setName('winTxt');
                
                var tim_txt = this.add.text ( sW * 0.92, sH * 0.6, '_', txtConfig ).setFontSize( sH*0.22 ).setOrigin(1, 0).setName('timeTxt');

              
                miniContainer.add ([ indBG, turn_ind, name_txt, tim_txt, win_txt ]);

                this.indicators.push (miniContainer);

            }
            



        },
        createControls : function () {

            var _this = this;

            this.contBtns = [];

            var bh = 70 * _scale, 
                bs = bh * 0.08,
                bx = 1052 * _scale,
                by = 135 * _scale;

            var buts = ['close', 'sound', 'music' ];

            for ( var i in buts ) {
                

                var miniContainer = this.add.container (bx + (300 *_scale), by + i * ( bh + bs) );

                var img = this.add.image ( 0, 0, 'cntrl_btns', 0 ).setData ('id', buts[i] ).setScale(_scale).setInteractive();
                
                img.on('pointerover', function () {
                    this.setFrame (1);
                });
                img.on('pointerout', function () {
                    this.setFrame (0);
                });
                img.on('pointerup', function () {
                    this.setFrame (0);
                });
                img.on('pointerdown', function () {
                    //console.log ( this.getData ('id') );
                    _this.controlBtnsClick ( this.getData('id') );
                });
                
                var emb = this.add.image ( 0, 0, 'thumbs', i ).setScale(_scale);

                miniContainer.add ([img, emb]);

                this.contBtns.push (miniContainer);

                this.tweens.add ({
                    targets : miniContainer,
                    x : bx,
                    duration : 300,
                    ease : 'Power2',
                    delay : i * 100
                });

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

            var frame = this.playerArr [ this.turn ].chipClr;

            var circ = this.add.image ( xp, _gameH *0.08, 'circles', frame + 1 ).setScale (_scale );

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

        },
        initGame : function () {

            this.promptLeave = false;

            this.playSound ('move');

            this. makeTurn ( this.turn );

        },
        makeTurn : function () {

            var oppTurn = this.turn == 0 ? 1 : 0;

            this.indicators[ oppTurn ].getByName ('turnInd').setFrame ( 0 );

            this.indicators[ this.turn ].getByName ('turnInd').setFrame ( 1 );

            if ( this.playerArr[ this.turn ].ai ) this.aiPick ();

        },
        switchTurn : function () {

            //console.log ('switch turn');

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
        analyzeMove ( pos ) {

            if ( this.isWinner ( this.turn, pos ) ) {
                this.gameWinner ();
            }else {
                this.switchTurn ();
            } 
        },
        gameWinner : function () {

            this.isGameOn = false;

            this.playerArr[this.turn].w += 1;

            this.indicators [this.turn].getByName ('winTxt').text = 'Wins : ' + this.playerArr[this.turn].w;

            var _this = this;

            setTimeout(() => {
                _this.playSound ('warp');
                _this.showWinPrompt ();
            }, 500 );
            
        },
        showPromptSmall : function ( txt ) {

            var _this = this;

            this.isPrompted = true;

            this.promptContainer = this.add.container (0, _gameH).setDepth(999);

            var img = this.add.image (0, 0, 'prompt_sm').setScale(_scale).setOrigin (0);

            var txtConfig = {
                color : '#6a6a6a',
                fontSize : 25 * _scale,
                fontFamily : 'Oswald'
            }

            var txt = this.add.text ( _gameW/2, _gameH/2, txt , txtConfig ).setOrigin(0.5);

            this.promptContainer.add ([img, txt])

            this.tweens.add ({
                targets : this.promptContainer,
                y : 0,
                duration : 500,
                easeParams : [1, 0.8],
                ease : 'Elastic'
            });

        },
        showPrompt : function ( txt, arr ) {

            var _this = this;

            this.isPrompted = true;

            this.promptContainer = this.add.container (0, _gameH).setDepth(999);

            var img = this.add.image (0, 0, 'prompt_xl').setScale(_scale).setOrigin (0);

            var txtConfig = {
                color : '#6a6a6a',
                fontSize : 22 * _scale,
                fontFamily : 'Oswald'
            }

            var txt = this.add.text ( _gameW/2, 350*_scale, txt , txtConfig ).setOrigin(0.5);

            this.promptContainer.add ([img, txt])

            var bw = 155 * _scale,
                bs = bw * 0.05,
                bx = (_gameW - (2 * (bw+bs) - bs ) )/2 + bw/2,
                by = _gameH * 0.57;

            for ( var i = 0; i < arr.length ; i++ ) {

                var btns = this.add.sprite ( bx + i *(bw + bs), by, 'prompt_btns2', 0 ).setData( 'id', arr[i].id ).setScale(_scale).setInteractive ();

                btns.on('pointerover', function () {
                    this.setFrame ( 1 );
                });
                btns.on('pointerout', function () {
                    this.setFrame ( 0 );
                });
                btns.on('pointerup', function () {
                    this.setFrame ( 0 );
                });
                btns.on('pointerdown', function () {
                    
                    _this.playSound ('beep');
                    _this.promptBtnsClick ( this.getData('id') );
                   
                });

                var txts = this.add.text ( bx + i *(bw + bs), by, arr[i].value, { color:'#6a6a6a', fontFamily:'Oswald', fontSize: 20*_scale } ).setOrigin (0.5);

                this.promptContainer.add ( [btns, txts] );
            }
            
            this.tweens.add ({
                targets : this.promptContainer,
                y : 0,
                duration : 500,
                easeParams : [1, 0.8],
                ease : 'Elastic'
            });


        },
        showWinPrompt : function () {

            var txt = ( this.turn == 0 ) ? 'Congratulations! You Win' : 'Sorry, You Lose';

            var btnArr = [
                {id:'playagain', value: 'Play Again'},
                {id:'exit', value: 'Exit'},
            ];

            this.showPrompt ( txt, btnArr );

        },
        showLeavePrompt : function () {

            var btnsArr = [
                {id:'leave', value:'Confirm'},
                {id:'cancel', value:'Cancel'}
            ]

            this.showPrompt ('Are you sure you want to leave?', btnsArr );

            this.promptLeave = true;

        },
        removePrompt : function () {

            if ( !this.isPrompted ) return;

            this.isPrompted = false;
            this.promptContainer.destroy();
        },
        promptBtnsClick : function (id) {

            switch (id) {

                case 'cancel':
                    this.promptLeave = false;

                    this.removePrompt ();
                    break;
                case 'leave':
                    this.leaveGame();
                    break;
                case "playagain":

                    if ( !this.initData.isSinglePlayer ) {

                        socket.emit ('rematchRequest');
                        
                        this.removePrompt ();
                        
                        this.showPromptSmall ('Waiting for confirmation..');
    
                    }else {
    
                        this.resetGame ();
                    }

                    break;

                case "exit":

                    if ( !this.initData.isSinglePlayer ) socket.emit ('leaveGame');

                    this.leaveGame ();

                    break;

            }
        },
        controlBtnsClick : function (id) {


            switch (id) {

                case 'close':

                    if ( this.promptLeave ) {

                        this.playSound ('error');


                    }else {

                        if ( !this.isGameOn ) {

                            this.leaveGame ();

                        }else {
    
                            this.showLeavePrompt();
                        }

                        this.playSound ('clicka');

                    }

                   

                    break;
                case 'music':
                    if ( this.bgsound.isPaused ) {
                        this.bgsound.resume()
                        
                    }else{
                        this.bgsound.pause();
                    }

                    this.contBtns[2].getAt (1).setFrame ( !this.bgsound.isPaused ? 2 : 5 );
                        
                    this.playSound ('clicka');
                    break;
                case 'sound':
                    this.soundOn = !this.soundOn;

                    this.contBtns[1].getAt (1).setFrame ( this.soundOn ? 1 : 4 );

                    this.playSound ('clicka');
                    break;
                default:
            }

           

        },
        resetGame : function () {
            
            this.removePrompt ();

            for ( var i in this.circles ) {
                this.circles [i].destroy();
            }
            for ( var j in this.grid ) {
                this.grid [j].isTaken = false;
                this.grid [j].resident = '-';
            }

            this.isGameOn = true;

            this.turn = this.turn == 0 ? 1 : 0;


            var _this = this;

            setTimeout(() => {

                _this.initGame ();

            }, 500 );
            

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
                
                _this.playSound ('clickb', 0.8 )

                _this.createCircle ( deep );
                
                _this.analyzeMove ( deep );

            }, 800 );
            

        }, 
        leaveGame : function () {

            this.bgsound.stop();

            this.scene.start('Intro');

        },
        playSound : function (snd, vol=0.5) {

            if ( this.soundOn ) this.music.play ( snd, { volume : vol });
        
        },
        isWinner : function ( turn, pos ) {

            var tempStr = turn == 0 ? '0000' : '1111';

            var verStr = this.checkVertical (pos);
            var horStr = this.checkHorizontal (pos);
            var bacStr = this.checkBackSlash (pos);
            var forStr = this.checkForwardSlash (pos);

            var win = verStr.includes (tempStr) || horStr.includes (tempStr) || bacStr.includes (tempStr) || forStr.includes (tempStr) ;

            return win;
                
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




} 
