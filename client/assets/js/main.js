
window.onload = function () {

    var SceneA = new Phaser.Class({

        Extends: Phaser.Scene,
    
        initialize:
    
        function SceneA ()
        {
            Phaser.Scene.call(this, { key: 'sceneA' });
        },
        preload: function ()
        {

            this.load.spritesheet('thumbs', 'client/assets/images/spritesheet1.png', { frameWidth: 50, frameHeight: 50 });

            this.load.spritesheet('circles', 'client/assets/images/circles.png', { frameWidth: 120, frameHeight: 120 });

            this.load.on('progress', function (value) {
                var perc = Math.floor ( value * 100 );
                console.log ( perc );
            });

        },

        create : function () {

            this.grid = [];
            this.isGameOn = true;

            this.isPlayer = false;

            this.createGraphics();

            this.createMyMask();


        },
        createGraphics : function () {

            var bs = Math.floor ( 116 * _xscale ),
                bx = (_gameW - (7 * bs))/2,
                by = Math.floor ( 10 * _yscale );

            var _this = this;

            this.rects = [];

            for ( var i = 0; i < 42; i++ ) {

                var ix = Math.floor ( i / 7 ),
                    iy = i % 7;

                var xp = bx + (iy * bs) + bs/2,
                    yp = by + (ix * bs) + bs/2;

                var rect = this.add.image ( xp, yp, 'circles', 2 ).setScale(_xscale);

                var circ = this.add.circle ( xp, yp, bs*0.4, 0xcecece, 1 );

                //var txt = this.add.text ( xp, yp, ix + ':' +iy, { color : '#000', fontSize : bs*0.18, fontFamily:'Verdana' }).setOrigin(0.5);

                //var txt = this.add.text ( xp, yp, i, { color : '#000', fontSize : bs*0.25, fontFamily:'Verdana' }).setOrigin(0.5);

                this.rects.push (circ);

                this.grid.push ({
                    'x' : xp,
                    'y' : yp,
                    'row' : ix,
                    'col' : iy,
                    'r' : bs*0.4,
                    'isTaken' : false,
                    'resident' : '-'
                });

            }
            //
            for ( var i = 0; i < 7; i++ ) {

                var brect = this.add.rectangle( bx + (i * bs), by, bs, bs*6, 0x33aa33, 0 ).setOrigin(0).setData ('cnt', i).setInteractive();

                brect.on ('pointerover', function () {
                    this.setFillStyle ( 0x330000, 0.3 );
                    _this.showDeep (this.getData('cnt'));
                });
                brect.on ('pointerout', function () {
                    this.setFillStyle ( 0x330000, 0 );
                    _this.resetDeep();
                });
                brect.on ('pointerdown', function () {
                    
                    if ( !_this.isGameOn ) return;

                    _this.createCircle (this.getData('cnt'));
                });
            }

        },
        createMyMask : function () {

            this.shape = this.make.graphics();
            
            this.shape.fillStyle(0xff33ff);
            
            this.shape.beginPath();

            for ( var i in this.grid ) {

                this.shape.fillCircle ( this.grid[i].x, this.grid[i].y, this.grid[i].r );
            }

            this.masker = this.shape.createGeometryMask();

        },
        createCircle : function ( numbr ) {

            var deep = this.getDeep(numbr);

            if ( deep == null ) return;

            this.isPlayer = !this.isPlayer;

            var bs = Math.floor ( 116 * _xscale );

            var xp = this.grid [deep].x,
                yp = this.grid [deep].y;

            var clr = this.isPlayer ? 0xff0000 : 0x0000ff;

            var frame = this.isPlayer ? 0 : 1;

            //var circ = this.add.circle ( xp, yp - _gameH, bs*0.4, clr, 1 );

            var circ = this.add.image ( xp, yp - _gameH, 'circles', frame ).setScale (_xscale );


            this.tweens.add ({
                targets : circ,
                y : yp,
                duration : 300,
                ease : 'Bounce',
                easeParams : [0.8, 1]
            });

            circ.setMask(this.masker)

            var playerID = this.isPlayer ? 0 : 1;

            this.grid [deep].isTaken  = true;
            this.grid [deep].resident  = playerID;

            this.checkWin ( playerID, deep )
            

        },
        showDeep : function ( numbr ) {

            var deep = this.getDeep ( numbr );

            if ( deep != null ) this.rects [deep].setFillStyle (0x33ff00, 1);

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
                this.isGameOn = false;
            
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
    
    var SceneB = new Phaser.Class({
    
        Extends: Phaser.Scene,
    
        initialize:
    
        function SceneB ()
        {
            Phaser.Scene.call(this, { key: 'SceneB' });
        },
        init : function ( data ) {
            
            this.grid = [];
            this.ways = [];
            this.hand = [];

            this.cards = {};

            this.cardActive = '';
    
        },
        preload: function ()
        {
            //...
        },
        create: function ()
        {
            this.initGraphicsPlacements ();

            this.initCards ();      
         
        },
        initPlayers : function () {
    
            var p1 = new Player ('self', 'Charlou');
            var p2 = new Player ('oppo', 'Charlie');
    
            this.player['self'] = p1;
            this.player['oppo'] = p2;
            
        },
        initGraphicsPlacements: function () {
    
            var cW = config.width * 0.28,
                cH = config.height * 0.2,
                cGx = cW * 0.32,
                cGy = cH * 0.22,
                csW = (cGx * 4) + cW,
                csX = ( config.width - csW )/2 + cW/2,
                //csX = config.width * 0.12 + (cW/2),
                csY = config.height * 0.15 + (cH/2);
            
            for ( var i=0; i<15; i++) {
    
                var x = Math.floor ( i/5 ),
                    y = i%5;
    
                var cX = csX + y * cGx,
                    cY = csY + ( x * ( cH + cGy ) );
    
                this.grid.push ({
                    'x' : cX,
                    'y' : cY,
                });
    
            }
    
            this.cardW = cW;
            this.cardH = cH;

            //...
        }, 
        initCards : function () {
    
            var _this = this;
            
            var cardValues = ['','2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] ;

            var cW = this.cardW,
                cH = this.cardH,
                cG = cW * 0.15,
                cT = (cG * 12) + cW
                cX = (config.width - cT)/2 + (cW/2),
                cY = config.height * 0.75 + ( cH/2);
    
            var order = this.shuffleCards();
    
            for ( var i=0; i<13; i++) {
    
                var cnt = order [i];
    
                var clr = Math.floor ( order[i]/ 26 );
    
                var tpe = Math.floor ( order[i]/ 13 );

                var trueVal = ( order[i] % 13 == 0 ) ? 13 : order[i] % 13;
    
                var card = new Card ( this, 'card' + i ,  config.width/2, config.height/2, this.cardW, this.cardH, cnt, clr, tpe, trueVal, i, cardValues[trueVal] );
    
            }

        }, 
        initControls :  function () {

            var rW = config.width,
                rH = config.height *0.08,
                rX = config.width/2,
                rY = config.height - rH/2;

            var rect = this.add.rectangle ( rX, rY, rW, rH, 0xcccccc, 1 );

            var graphics = this.add.graphics();
            
           
            graphics.lineStyle ( 1, 0x9c9c9c );
            graphics.beginPath();
            graphics.moveTo( 0, config.height*0.94);
            graphics.lineTo( config.width, config.height*0.94);
            graphics.strokePath();
               
            graphics.lineStyle ( 1, 0xdedede );
            graphics.beginPath();
            graphics.moveTo( 0, config.height*0.941);
            graphics.lineTo( config.width, config.height*0.941);
            graphics.strokePath();

            var tpH = rH * 0.4,
                tpX = rX,
                tpY = rY - (rH/2) - (tpH/2);

            var controlTxtConfig = {
                color : '#ff3300',
                fontSize : tpH * 0.5,
                fontStyle : 'bold',
                fontFamily : "Trebuchet MS",
            };
            
            this.txtControl = this.add.text ( tpX, tpY, '', controlTxtConfig ).setOrigin ( 0.5);

            var txtPrompt = [ 'Auto Arrange', 'Sort Levels', 'Switch Mid and Bottom Levels', 'Ready', 'Exit Game' ];

            var bCnt = 5,
                bS = rH * 0.7,
                bG = config.width *0.02,
                bT = bCnt * ( bS + bG ) - bG,
                bX = (config.width - bT) /2 + (bS/2),
                bY = rY;
            
            var _this = this;

            for ( var i = 0; i < bCnt; i++ ) {

                var cnt = new ControlButton ( this, 'cnt' + i, bX + i * ( bS + bG), bY, bS, i ).setAlpha ( 0 );

                cnt.on ( 'pointerdown', function () {

                    this.change ( 0xff9999 )
                    console.log ( this.id );

                    switch ( this.id  ) {
                        case 'cnt0' : 
                        break;
                        case 'cnt1' : 
                            _this.sortLevels();
                        break;
                        case 'cnt2' : 
                            _this.switchLowCards();
                        break;
                        case 'cnt3' : 
                        break;
                        case 'cnt4' : 
                        break;
                        
                    }
                });
                cnt.on ( 'pointerover', function () {
                    this.change ( 0xc3c3c3 );

                    _this.txtControl.text = '- ' + txtPrompt [ this.frame ] + ' -';
                });
                cnt.on ( 'pointerout', function () {
                    this.change ( this.bgColor );
                    
                });
                cnt.on ('pointerup', function () {
                    this.change ( this.bgColor );
                });

                this.tweens.add ({
                    targets : cnt,
                    alpha : 1,
                    duration : 800,
                    ease : 'Power2',
                    delay : 1000
                });


            }

        },
        initIndicators : function () {
            //var trect = this.add.rectangle ( 0, 0, tW, tH, 0xcccccc, 1 ).setOrigin(0);


            var pW = config.width * 0.95,
                pH = config.height *0.08,
                pX = config.width/2,
                pY = config.height *0.02;


            var pInd = new PlayerIndicator ( this, 'self', pX, pY + pH/2, pW, pH, "Chalnicol" );


            //way
            var xs = config.width *0.25,
                ys = config.height * 0.22,
                r = config.width*0.1;

            var wayInd = new WayIndicator ( this, 'wind', xs, ys, r*2 );

            this.wind = wayInd;

            //

        },
        shuffleCards : function () {
    
            var tmp_arr = [];
            for ( var i = 0; i < 52; i++ ) {
                tmp_arr.push (i);
            };
    
            var fin_arr = [];
    
            while ( tmp_arr.length > 0) {
    
                var rnd = Math.floor ( Math.random() * tmp_arr.length );
    
                fin_arr.push ( tmp_arr[rnd] );
    
                tmp_arr.splice ( rnd, 1 );
    
            }
    
            return fin_arr;
    
        },
        moveCards: function () {

            for ( var i = 0; i < 13; i++) {

                var card = this.cards [ 'card' + ( 12 - i) ];

                card.index = i;

                this.tweens.add ( {

                    targets : card,
                    x : this.grid [i + 2].x,
                    y : this.grid [i + 2].y,
                    duration : 200,
                    ease : 'Power2',
                    delay : i * 50,
                    onComplete : function () {
                        
                        var depth = this.targets[0].index;

                        this.targets[0].flipOpen();

                        this.targets[0].setDepth (depth) 

                    }
                });

                this.hand.push ( card.id );

            }

            //this.evaluateHand ();

        }
       
    
    });
    

    //..PlayerIndicators...
    var PlayerIndicator = new Phaser.Class({
    
        Extends: Phaser.GameObjects.Container,
    
        initialize:
    
        function PlayerIndicator ( scene, id, x, y, width, height, name )
        {
            Phaser.GameObjects.Container.call(this, scene)
    
            this.setPosition(x, y).setSize( width, height);
    
            this.id = id;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.name = name;
    
            this.shape = scene.add.graphics ({ lineStyle : { color: 0xa4a4a4, width:1 } });
            
            //this.shape.fillStyle ( 0x9c9c9c, 0.5 );
            //this.shape.fillRoundedRect ( -width/2, -height/2 + 3, width, height, height*0.1);

            this.shape.fillStyle ( 0xf3f3f3, 1 );
            this.shape.fillRoundedRect ( -width/2, -height/2, width, height, height*0.1);
            this.shape.strokeRoundedRect ( -width/2, -height/2, width, height, height*0.1);
    
            var top = -height/2, 
                left = -width/2;

            var cx = left + width *0.08,
                cy = top + height/2,
                r = height *0.37;

    
            this.circ = scene.add.circle ( cx, cy, r, 0xcccccc, 1 ).setStrokeStyle(1, 0xa4a4a4 );

            var bankTxtConfig = { 
                fontFamily: 'Trebuchet MS', 
                fontSize: Math.floor( r*2*0.7 ), 
                fontStyle: 'bold',
                color: '#f3f3f3' 
            };

            this.text = scene.add.text ( cx, cy, 'P', bankTxtConfig ).setOrigin(0.5);
            //this.text.setStroke('#9c9c9c', 5 );
            this.text.setShadow( 2, 2, '#9c9c9c', 5, true, true );

            var txtConfig = { 
                fontFamily: 'Trebuchet MS', 
                fontSize: Math.floor( height * 0.33 ), 
                fontStyle: 'bold',
                color: '#339966' 
            };
    
            var tX = left + (width * 0.16),
                tY = top + (height * 0.15); 
    
            this.texta = scene.add.text ( tX, tY, name, txtConfig ).setOrigin(0);
            
            //money

            var moneyTxtConfig = { 
                fontFamily: 'Trebuchet MS', 
                fontSize: Math.floor( height * 0.25 ), 
                fontStyle: 'bold',
                color: '#6a6a6a' 
            };
            
            var tXa = left + (width * 0.16),
                tYa = top + (height * 0.55); 

            this.textb = scene.add.text ( tXa, tYa, 'Bank : P20,000', moneyTxtConfig ).setOrigin(0);
    
            this.add ([ this.shape, this.circ, this.text, this.texta,  this.textb ]); // add elements to this container..
    
            scene.children.add ( this ); //add to scene...
            
        }
    
    });
    
    var parentDiv = document.getElementById('game_div');

    var config = {

        type: Phaser.AUTO,
        width: parentDiv.clientWidth,
        height: parentDiv.clientHeight,
        backgroundColor: '#dedede',
        audio: {
            disableWebAudio: false
        },
        parent:'game_div',
        scene: [ SceneA ]

    };

    var _gameW = config.width,
        _gameH = config.height;

    var _xscale = config.width/1280,
        _yscale = config.height/720;

    var game = new Phaser.Game(config);

}

    







