class SceneB extends Phaser.Scene {

    constructor ()
    {
        super('SceneB');
    }

    preload ()
    {
        //...    
    }
    create ( data ) {

        this.initData = data;

        this.gameDims = {
            w : this.game.config.width,
            h : this.game.config.height
        }

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

    }
    initSocketIOListeners () {

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
        
    }
    createMusicAndSound () {
        
        this.bgsound = this.sound.add ('bgsound2').setVolume(0.2).setLoop(true);
        this.bgsound.play();

        this.soundOn = true;

        this.music = this.sound.addAudioSprite('sfx');
        
    }
    createGraphics () {

        
        var _this = this;

        

        //add background img
        const bg = this.add.image ( this.gameDims.w/2, this.gameDims.h/2, 'bgimage');

        //add the holes bg..
        const bgCenter = this.add.image ( this.gameDims.w/2, this.gameDims.h/2, 'center_img');


        //create holes and grid...

        this.rects = [];

        const bs = 100,
              bx = (this.gameDims.w - (7 * bs))/2,
              by = 100;


        for ( var i = 0; i < 42; i++ ) {

            var ix = Math.floor ( i / 7 ),
                iy = i % 7;

            var xp = bx + (iy * bs) + bs/2,
                yp = by + (ix * bs) + bs/2;

            var cbg = this.add.image ( xp, yp, 'circles', 3 );

            var rect = this.add.image ( xp, yp, 'circles', 0 ).setDepth(999);

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

    }
    createPlayers () {

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
    }
    createIndicators () {

        
        
        this.indicators = [];

        var sW = 350,
            sH = 80,
            sS = sW * 0.02, 
            sX = (this.gameDims.w - (2 * ( sW + sS ) - sS) )/2,
            sY = 5;

        var txtConfig = { fontFamily: 'Poppins', color: '#f3f3f3', fontSize : sH * 0.25 };


        for ( var i = 0; i < 2; i++ ) {

            var xp = sX + i * (sW+sS),
                yp = sY;

            var miniContainer = this.add.container (xp, yp).setName ( this.playerArr[i].id );

            var indBG = this.add.image (0, 0, 'indicator_bg').setOrigin (0);

            var turn_ind = this.add.image ( sW * 0.12, sH/2, 'indicator_turn', ).setName('turnInd');;

            var name_txt = this.add.text ( sW * 0.21, sH/2, this.playerArr[i].name, txtConfig ).setOrigin(0, 0.5).setName('nameTxt');
        
            var win_txt = this.add.text ( sW * 0.92, sH * 0.18, 'Wins : 0', txtConfig ).setFontSize( sH*0.22 ).setOrigin(1, 0).setName('winTxt');
            
            var tim_txt = this.add.text ( sW * 0.92, sH * 0.6, '_', txtConfig ).setFontSize( sH*0.22 ).setOrigin(1, 0).setName('timeTxt');

          
            miniContainer.add ([ indBG, turn_ind, name_txt, tim_txt, win_txt ]);

            this.indicators.push (miniContainer);

        }
        



    }
    createControls () {

        var _this = this;

        this.contBtns = [];

        var bh = 70, 
            bs = bh * 0.08,
            bx = 1052,
            by = 135;

        var buts = ['close', 'sound', 'music' ];

        for ( var i in buts ) {
            

            var miniContainer = this.add.container (bx + (300), by + i * ( bh + bs) );

            var img = this.add.image ( 0, 0, 'cntrl_btns', 0 ).setData ('id', buts[i] ).setInteractive();
            
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
            
            var emb = this.add.image ( 0, 0, 'thumbs', i );

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

    }
    createMyMask () {

        this.shape = this.make.graphics();
        
        this.shape.fillStyle(0xff33ff);
        
        this.shape.beginPath();

        this.shape.fillRect ( 263, 100, 755, 616 );

        this.masker = this.shape.createGeometryMask();

        

    }
    createCircle ( deep ) {

        var bs = 116;

        var xp = this.grid [deep].x,
            yp = this.grid [deep].y;

        var frame = this.playerArr [ this.turn ].chipClr;

        var circ = this.add.image ( xp, this.gameDims.h *0.08, 'circles', frame + 1 );

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

    }
    initGame () {

        this.promptLeave = false;

        this.playSound ('move');
        this.shotCount = 0;

        this. makeTurn ( this.turn );

    }
    makeTurn () {

        var oppTurn = this.turn == 0 ? 1 : 0;

        this.indicators[ oppTurn ].getByName ('turnInd').setFrame ( 0 );

        this.indicators[ this.turn ].getByName ('turnInd').setFrame ( 1 );

        if ( this.playerArr[ this.turn ].ai ) this.aiPick ();

    }
    switchTurn () {

        //console.log ('switch turn');

        this.turn = this.turn == 0 ? 1 : 0;

        this.makeTurn ();

    }
    showDeep ( numbr ) {

        var deep = this.getDeep ( numbr );

        if ( deep != null ) this.rects [deep].setFillStyle (0x00ff00, 1);

    }
    resetDeep () {
        for ( var i in this.rects ) {
            this.rects[i].setFillStyle (0xcecece, 1);
        }
    }
    getDeep  (col) {

        for ( var i = 0; i < 6; i++ ) {

            var deep = col  + ((5-i) * 7 );

            if ( !this.grid [deep].isTaken ) {
                return deep;
            }
            
        }
        return null;

    }
    analyzeMove ( pos ) {

        if ( this.isWinner ( this.turn, pos ) ) {
            this.gameWinner ();
        }else {

            this.shotCount += 1;
            
            if ( this.shotCount >= 42) {
                this.gameDraw();
            }else {
                this.switchTurn ();
            }
            
        } 
    }
    gameDraw () {
        
        this.isGameOn = false;

        this.time.delayedCall ( 500, function () {
            this.playSound ('warp');
            this.showDrawPrompt();
        }, [], this);

    }
    gameWinner () {

        this.isGameOn = false;

        this.playerArr[this.turn].w += 1;

        this.indicators [this.turn].getByName ('winTxt').text = 'Wins : ' + this.playerArr[this.turn].w;

        this.time.delayedCall ( 500, function () {
            this.playSound ('warp');
            this.showWinPrompt();
        }, [], this);

    }
    showPromptSmall ( txt ) {

        var _this = this;

        this.isPrompted = true;

        this.promptContainer = this.add.container (0, this.gameDims.h).setDepth(999);

        var img = this.add.image (0, 0, 'prompt_sm').setOrigin (0);

        var txtConfig = {
            color : '#6a6a6a',
            fontSize : 25,
            fontFamily : 'Oswald'
        }

        var txt = this.add.text ( this.gameDims.w/2, this.gameDims.h/2, txt , txtConfig ).setOrigin(0.5);

        this.promptContainer.add ([img, txt])

        this.tweens.add ({
            targets : this.promptContainer,
            y : 0,
            duration : 500,
            easeParams : [1, 0.8],
            ease : 'Elastic'
        });

    }
    showPrompt ( txt, arr ) {

        var _this = this;

        this.isPrompted = true;

        this.promptContainer = this.add.container (0, this.gameDims.h).setDepth(999);

        var img = this.add.image (0, 0, 'prompt_xl').setOrigin (0);

        var txtConfig = {
            color : '#6a6a6a',
            fontSize : 22,
            fontFamily : 'Oswald'
        }

        var txt = this.add.text ( this.gameDims.w/2, 350, txt , txtConfig ).setOrigin(0.5);

        this.promptContainer.add ([img, txt])

        var bw = 155,
            bs = bw * 0.05,
            bx = (this.gameDims.w - (2 * (bw+bs) - bs ) )/2 + bw/2,
            by = this.gameDims.h * 0.57;

        for ( var i = 0; i < arr.length ; i++ ) {

            var btns = this.add.sprite ( bx + i *(bw + bs), by, 'prompt_btns2', 0 ).setData( 'id', arr[i].id ).setInteractive ();

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

            var txts = this.add.text ( bx + i *(bw + bs), by, arr[i].value, { color:'#6a6a6a', fontFamily:'Oswald', fontSize: 20 }).setOrigin (0.5);

            this.promptContainer.add ( [btns, txts] );
        }
        
        this.tweens.add ({
            targets : this.promptContainer,
            y : 0,
            duration : 500,
            easeParams : [1, 0.8],
            ease : 'Elastic'
        });


    }
    showDrawPrompt () {

        var btnArr = [
            {id:'playagain', value: 'Play Again'},
            {id:'exit', value: 'Exit'},
        ];

        this.showPrompt ( 'Game is a draw.', btnArr );
    }
    showWinPrompt () {

        var txt = ( this.turn == 0 ) ? 'Congratulations! You Win' : 'Sorry, You Lose';

        var btnArr = [
            {id:'playagain', value: 'Play Again'},
            {id:'exit', value: 'Exit'},
        ];

        this.showPrompt ( txt, btnArr );

    }
    showLeavePrompt () {

        var btnsArr = [
            {id:'leave', value:'Confirm'},
            {id:'cancel', value:'Cancel'}
        ]

        this.showPrompt ('Are you sure you want to leave?', btnsArr );

        this.promptLeave = true;

    }
    removePrompt () {

        if ( !this.isPrompted ) return;

        this.isPrompted = false;
        this.promptContainer.destroy();
    }
    promptBtnsClick (id) {

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
    }
    controlBtnsClick (id) {


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

       

    }
    resetGame () {
        
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

        this.shotCount = 0;

        this.time.delayedCall ( 500, this.initGame, [], this );
        

    }
    aiPick () {

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
        

    } 
    leaveGame () {

        this.bgsound.stop();

        this.scene.start('SceneA');

    }
    playSound (snd, vol = 0.5) {

        if ( this.soundOn ) this.music.play ( snd, { volume : vol });
    
    }
    isWinner ( turn, pos ) {

        var tempStr = turn == 0 ? '0000' : '1111';

        var verStr = this.checkVertical (pos);
        var horStr = this.checkHorizontal (pos);
        var bacStr = this.checkBackSlash (pos);
        var forStr = this.checkForwardSlash (pos);

        var win = verStr.includes (tempStr) || horStr.includes (tempStr) || bacStr.includes (tempStr) || forStr.includes (tempStr) ;

        return win;
            
    }
    checkVertical ( gp ) {

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

    }
    checkHorizontal ( gp ) {

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

    }
    checkBackSlash ( gp ) {

        let r = this.grid[gp].row,
            c = this.grid[gp].col;

        let tmpC = c, tmpR = r;

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

    }
    checkForwardSlash ( gp ) {

        var r = this.grid[gp].row,
            c = this.grid[gp].col;

        var tmpC = c, tmpR = r;

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
    
}