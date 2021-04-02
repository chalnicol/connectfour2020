class Login extends Phaser.Scene {

    constructor ()
    {
        super('Login');
    }

    create () 
    {

        

        let _this = this;

        const bg = this.add.image ( 640, 360, 'bgimage');

        //let username = "player" + Math.floor (Math.random() * 99999);
        this.add.image ( 640, 120, 'eprofile').setScale (0.4);

        this.add.text ( 640, 200, 'Please input your username ( 6-15 characters )', { color:'#3a3a3a', fontSize: 20, fontFamily: 'Oswald'} ).setOrigin(0.5);

        this.add.rectangle ( 640, 260, 500, 55, 0xffffff, 1 ).setStrokeStyle ( 1, 0x0a0a0a );

        let usertxt = this.add.text ( 640, 260, 'username here' , { color:'#6a6a6a', fontSize: 30, fontFamily: 'Oswald'}  ).setOrigin(0.5);
        
        let usertmp = '';


        //create keys..

        const str = '0123456789abcdefghijklmnopqrstuvwxyz';

        const bs = 5;

        const bw = (500 - (bs*9)) / 10 , bh = 45;

        const bsx = (1280 - 500) / 2 + ( bw/2 );

        for ( var i = 0; i < str.length; i++ ) {

            let ix = Math.floor ( i/10 ), iy = i%10;

            let xp = (iy * ( bw + bs) ) + bsx, yp = (ix * (bh + bs )) + 320;

            let miniCont = this.add.container ( xp, yp ).setData ( 'id', i ).setSize(bw, bh).setInteractive();

            let rct = this.add.rectangle ( 0, 0, bw, bh, 0xffffff, 1 ).setStrokeStyle ( 1, 0x0a0a0a );

            let txt =  this.add.text ( 0, 0, str.charAt(i), { color:'#3a3a3a', fontSize: 20, fontFamily: 'Oswald'} ).setOrigin(0.5);

            miniCont.add ( [ rct, txt]);

            miniCont.on ('pointerover', function () {
                //..
                this.first.setFillStyle ( 0xcccccc, 1 );
            });
            miniCont.on ('pointerout', function () {
                //..
                this.first.setFillStyle ( 0xffffff, 1 );
                
            });
            miniCont.on ('pointerup', function () {
                //..
                this.first.setFillStyle ( 0xffffff, 1 );
                
            });
            miniCont.on ('pointerdown', function () {

                if ( usertmp.length < 15 ) {

                    this.first.setFillStyle ( 0xff9999, 1 );

                    usertmp += str.charAt (this.getData ('id'));

                    usertxt.text = usertmp;
                }

            });

        }


        const cntrls = [ 'Backspace', 'Clear All', 'Enter' ];

        const bcw = (500 - (bs*2)) / 3 , bch = 40;

        const bcsx = (1280 - 500) / 2 + ( bcw/2 );

        //create controls..
              
        for ( var i = 0; i < 3; i++ ) {
            
            let cnt = this.add.container ( bcsx + i*( bcw + bs), 530).setSize ( bcw, bch ).setData('id', i ).setInteractive();

            let rcta = this.add.rectangle ( 0, 0, bcw, bch, 0xffffff, 1 ).setStrokeStyle ( 1, 0x0a0a0a );

            let txta = this.add.text ( 0, 0, cntrls [i] , { color:'#6a6a6a', fontSize: 20, fontFamily: 'Oswald'}  ).setOrigin(0.5);

            cnt.add ([ rcta, txta ]);

            cnt.on ('pointerover', function () {
                //..
                this.first.setFillStyle ( 0xcccccc, 1 );
            });
            cnt.on ('pointerout', function () {
                //..
                this.first.setFillStyle ( 0xffffff, 1 );
                
            });
            cnt.on ('pointerup', function () {
                //..
                this.first.setFillStyle ( 0xffffff, 1 );
                
            });
            cnt.on ('pointerdown', function () {

                this.first.setFillStyle ( 0xff9999, 1 );

                switch (this.getData('id')) {
                    case 0:

                        if ( usertmp.length > 0) {

                            usertmp = usertmp.slice ( 0, -1 );
                           
                            usertxt.text =  ( usertmp.length == 0 ) ? 'username here' : usertmp;
                           
                        }

                        break;
                    case 1:

                        if ( usertmp.length > 0) {

                            usertmp ='';

                            usertxt.text = 'username here';
                        }
        
                        break;
                    case 2:

                        if ( usertmp.length >= 6 ) {
                            
                            socket = io();

                            socket.emit ('initUser', usertmp  );
                            
                            _this.scene.start ('SceneA', { 'username' : usertmp });

                        }

                        break;
                    default:
                        break;
                }
            });

        }
        



    }

}
