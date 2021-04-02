class SceneA extends Phaser.Scene {

    constructor ()
    {
        super('SceneA');
    }

    init ( data) {
        this.username = data.username;
    }
    preload ()
    {
    }
    create () {

        socket = io();

        this.gameDims = {
            w : this.game.config.width,
            h : this.game.config.height
        }

        this.isSetGame = false;

        this.initSound();
        
        this.initsocketIOListeners();

        this.initInterface ();
        
        socket.emit ('initUser', 'chalnicol' );

        socket.emit ('getInitData');
        
    }
    initsocketIOListeners () {

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


    }
    initSound () {
        

        this.bgsound = this.sound.add ('bgsound').setVolume(0.2).setLoop(true);
        this.bgsound.play();

        this.music = this.sound.addAudioSprite('sfx');

    }
    initInterface () {

        const bg = this.add.image ( this.gameDims.w/2, this.gameDims.h/2, 'bgimage');

        const bg2 = this.add.image ( this.gameDims.w/2, this.gameDims.h/2, 'bg_img1');

        const title = this.add.image ( this.gameDims.w/2, this.gameDims.h/2, 'title');

        //profile   
        //const username = "Player" + Math.floor ( Math.random() * 999999 );

        const txtConfig = { color:'#000', fontSize:30, fontFamily:'Oswald'};

        this.playerName = this.add.text ( 104, 28, this.username, txtConfig ).setOrigin (0);

        const txtConfig1 = { color:'#7d7d7d', fontSize:20, fontFamily:'Oswald'};

        this.playersPairID = this.add.text ( 104, 64, 'Pairing ID : --', txtConfig1 ).setOrigin (0);
        
        const txtConfig2 = { color:'#cc4300', fontSize:20, fontFamily:'Oswald'};
        
        this.playersOnlineTxt = this.add.text ( 33, 110, 'Player Online : --', txtConfig2 ).setOrigin (0);
        
        //menu...
        const strX = 380,
            strY = 410,
            strS = 260;

        const mW = 235;

        for ( var i = 0; i < 3; i++ ) {

            var miniContainer = this.add.container ( strX + i*(strS), strY + this.gameDims.w/2 ).setSize (mW, mW).setData ('id', i).setInteractive();;

            var menue = this.add.image ( 0, 0, 'menu_intro', i ).setScale();

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
    }
    menuClick ( id ) {

        if ( this.isSetGame ) return;

        switch (id) {
            case 0 : 

                socket.emit ('enterGame', {
                    'isSinglePlayer' : true,
                    'isChoosingOpponent' : false,
                    'isTimed' : false
                });

                this.showWaitScreen ();

            break;
            case 1 : 

                socket.emit ('enterGame', {
                    'isSinglePlayer' : false,
                    'isChoosingOpponent' : true,
                    'isTimed' : false
                });

                this.showPromptScreen ('connect');

            break;
            case 2 : 
                this.showConnectToFriendScreen();
            break;
            default:
        }

    }
    showWaitScreen () {

        var _this = this;

        this.isPrompted = true;

        this.rectBg = this.add.rectangle ( 0, 0, this.gameDims.w, this.gameDims.h, 0x000000, 0.7 ).setOrigin(0).setInteractive();

        this.promptScreen = this.add.container (0, this.gameDims.h/2).setDepth(999);

        const mywindow = this.add.image ( 0, 0, 'prompt' ).setOrigin ( 0 );

        const yp = Math.floor ( 300 * this.gameDims.h/720 );
       
        const img0 = this.add.image ( this.gameDims.w/2, yp, 'circ0', 0 ).setRotation ( Math.PI/180 * (Math.random() * 360));

        const img1 = this.add.image ( this.gameDims.w/2, yp, 'circ0', 1).setRotation ( Math.PI/180 * (Math.random() * 360 ));

        const img2 = this.add.image ( this.gameDims.w/2, yp, 'circ0', 2).setRotation ( Math.PI/180 * (Math.random() * 360) );

        const txtp = Math.floor ( 380 * this.gameDims.h/720);

        const txt = this.add.text ( this.gameDims.w/2, txtp, 'Please Wait..', { color:'#3a3a3a', fontSize: Math.floor ( 30 * this.gameDims.h/720 ), fontFamily : 'Oswald'}).setOrigin(0.5);

        this.promptScreen.add ([ mywindow, img0, img1, img2, txt ]);

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

    }
    showPromptScreen ( promptType, err='' ) {

        var _this = this;

        this.isPrompted = true;

        this.rectBg = this.add.rectangle ( 0, 0, this.gameDims.w, this.gameDims.h, 0x000000, 0.7 ).setOrigin(0).setInteractive();

        this.promptScreen = this.add.container (0, this.gameDims.h/2).setDepth(999);

        //..
        const mywindow = this.add.image ( 0, 0, 'prompt' ).setOrigin ( 0 );

        const bx = this.gameDims.w/2,
              by = this.gameDims.h * 0.525;

        const txtx = this.gameDims.w/2,
              txty = this.gameDims.h * 0.385,
              txtH = 32;

        const str = ( promptType == 'connect') ? 'Connecting..' : err ;

        const txt = this.add.text ( txtx, txty, str, { color : '#746a62', fontSize: txtH, fontFamily:'Oswald' }).setOrigin(0.5);

        this.promptScreen.add ([ mywindow, txt ] );

        let btn_id = "", btn_fr = 0;

        if ( promptType == 'connect')
        {
            const max = 5;

            const bSize =20, bSpace = 3,
                  bTotal = max * ( bSize + bSpace ) - bSpace,
                  cX = (this.gameDims.w - bTotal)/2  + (bSize/2),
                  cY = this.gameDims.h * 0.45;

            const duration = 500, delay = duration/max;

            for ( var i=0; i<max; i++) {

                var circ = this.add.circle ( cX + i*( bSize + bSpace), cY, bSize/2, 0x6c6c6c, 1 );
        
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

        let btn = this.add.image ( bx, by, 'prompt_btns', btn_fr ).setData({'frame': btn_fr, 'id' : btn_id}).setOrigin(0.5).setInteractive();

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

    }
    showInviteScreen  ( data ) {

        var _this = this;

        this.isPrompted = true;

        this.rectBg = this.add.rectangle ( 0, 0, this.gameDims.w, this.gameDims.h, 0x000000, 0.7 ).setOrigin(0).setInteractive();

        this.promptScreen = this.add.container (0, this.gameDims.h/2).setDepth(999);

        var mywindow = this.add.image ( 0, 0, 'invite' ).setOrigin ( 0 );
        
        const txtH = Math.floor ( 28 * this.gameDims.w/1280 ),
            txtX = Math.floor ( 640 * this.gameDims.w/1280 ),
            txtY = Math.floor ( 265 * this.gameDims.h/720 );

        const textNameConfig = { 
            color:'#9c5825', 
            fontSize: txtH,
            fontFamily : 'Oswald'
        };
        
        let gameType = data.isTimed ? 'Blitz' : 'Classic';

        let str = data.invite + ' has Invited you to a "'+ gameType +'" game.';

        let textName = this.add.text ( txtX, txtY, str, textNameConfig ).setOrigin(0.5, 0);


        this.promptScreen.add ([ mywindow, textName]);

        let dataArr = [{ id : 'accept', frame : 4 }, { id : 'reject', frame : 6 } ];

        var _this = this;
        
        const btw = Math.floor ( 224 * this.gameDims.w/1280 ),
            bts = btw * 0.1,
            btx = (this.gameDims.w - ((btw * 2) + bts))/2 + btw/2,
            bty = Math.floor ( 360 * this.gameDims.h/720 );
            
        for ( var i = 0; i < dataArr.length; i++ ) {

            var btn = this.add.image ( btx + i * (btw + bts), bty, 'prompt_btns', dataArr[i].frame ).setScale (this.gameDims.w/1280).setData ( dataArr[i] ).setInteractive();
            
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
        
    }
    showConnectToFriendScreen () {

        var _this = this;
        
        this.connectScreenShown = true;

        this.rectBg = this.add.rectangle ( 0, 0, this.gameDims.w, this.gameDims.h, 0x000000, 0.7 ).setOrigin(0).setInteractive();

        this.connectScreen = this.add.container (0,this.gameDims.h).setDepth (999);

        const rX = Math.floor ( 809 * this.gameDims.w/1280 ),
              rY = Math.floor ( 122 * this.gameDims.h/720 ),
              rz = Math.floor ( 62 * this.gameDims.w/1280 );

        const rectUnder = this.add.rectangle ( rX, rY, rz, rz ).setInteractive();

        rectUnder.on ('pointerdown', function () {
            
            _this.music.play ('clicka');
            _this.removeConnectScreen ();

        });


        const myWindow = this.add.image (0, 0, 'pairing_img' ).setOrigin ( 0 ).setScale(this.gameDims.w/1280);

        const txtH = 56;

        const txtConfig = { 
            color:'#4e4e4e', 
            fontSize: txtH, 
            fontFamily:'Oswald', 
        };

    
        const txt = this.add.text (780, 180, '0', txtConfig ).setOrigin (1, 0);

        this.connectScreen.add ([ rectUnder, myWindow, txt ]);

        let inputCount = 0, maxInput = 6;

        const  xW = 105, xH = 83, xSp = 3,
               xStart = ((this.gameDims.w - ((3 * (xW + xSp)) - xSp))/2) + xW/2,
               yStart = 305 ;

        const keysVal = [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'clr', 'ok' ];

        for ( var i = 0; i < 12; i++ ) {

            let ix = Math.floor ( i/3 ), iy = i%3;

            let xs = xStart + iy * (xW + xSp),
                ys = yStart + ix *( xH + xSp );

            let keys = this.add.image ( xs, ys, 'keys' ).setData('id', i).setInteractive();

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
            let txts = this.add.text ( xs, ys, keysVal[i], { color : '#3a3a3a', fontSize: xH * 0.4, fontFamily : 'Oswald' }).setOrigin(0.5);

            this.connectScreen.add ( [keys, txts] );

        }

        this.tweens.add ({
            targets : this.connectScreen,
            y : 0,
            duration : 300,
            easeParams : [0, 1.5],
            ease : 'Elastic'
        });



    }
    removePrompt () {

        this.isPrompted = false;
        
        this.promptScreen.destroy ();
        
        this.rectBg.destroy();


    }
    removeConnectScreen () {

        this.connectScreenShown = false;

        this.connectScreen.destroy ();

        this.rectBg.destroy();
        
    }
    initGame ( data ) {

        socket.removeAllListeners();

        this.bgsound.stop();

        this.scene.start('SceneB', data );

    }

}
