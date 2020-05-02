
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv,{});

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

//serv.listen(2000);
serv.listen(process.env.PORT || 2000);

console.log("Server started.");


var socketList = {};
var playerList = {};
var roomList = {};

//Player..
Player = function ( id, username ){
	
	var plyr  = {
		
		id:id,
		username:username,
		pid : '',
		roomid : '',
		tmpRoom : '',
		index : 0,
		type : 0,
		winCount : 0,
		isInited : false,
		isReady:false,
		isReadyForRematch : false
	}
	plyr.score = function () {

		plyr.winCount += 1;

	}
	plyr.gameResetData = function () {

		plyr.isReady = false;
		plyr.isReadyForRematch = false;
		
	}
	plyr.gameReset = function () {

		plyr.gameResetData();
		//plyr.type = plyr.type == 0 ? 1 : 0;
	}
	plyr.resetAll = function () {
		
		plyr.gameResetData();
		
		plyr.index = 0;
		plyr.type = 0;
		plyr.winCount = 0;
		plyr.roomid = '';
		plyr.tmpRoom = '';
	}

	return plyr;

}

//Rooms..
GameRoom = function ( id, isTimed=false, blitzTime = 15 ) {
	
	var rm = {

		id : id,
		blitzTime : blitzTime,
		turn : 0,
		initialTurn : 0,
		counter : 0,
		isWinner : '',
		isWinning : '',
		playerCount : 0,
		isClosed : false,
		isTimed : isTimed,
		isTicking : false,
		isGameOn : false,
		timer : null,
		phase : '',
		playerIDs : [],
		grid : []

	}

	rm.stopTimer = function () {
		
		clearInterval( rm.timer );

		rm.isTicking = false;
	}
	rm.startTimer = function ( max ) {
		//..

		rm.isTicking = true;

		//clearInterval ( rm.timer );

		rm.timer = setInterval ( function () {

			rm.counter += 1;
			
			if ( rm.counter >= max) {
				
				rm.stopTimer ();

				rm.endGame ();

				rm.getWinner ();

				timeRanOut ( rm.id );
				
			}

		}, 1000 );
		
	}
	rm.createGrid = function () {

		rm.grid = [];

		for ( var i = 0; i< 42; i++ ) {

			var r = Math.floor ( i/7 ), c = i % 7;

			rm.grid.push ({
				'row' : r,
				'col' : c,
				'isTaken' : false,
				'resident' : '-'
			});

		}

	}
	rm.initGame  = function () {

		//console.log ('\n --> Game is initialized', rm.id );

		rm.isGameOn = true;

		rm.isClosed = true;

		rm.createGrid ();

		rm.counter = 0;

		if ( rm.isTimed ) rm.startTimer( rm.blitzTime );

	}
	rm.startGame  = function () {

		//..
		if ( rm.isTicking ) rm.stopTimer ();

		rm.counter = 0;

		if ( rm.isTimed ) rm.startTimer( rm.blitzTime );

	}
	rm.endGame = function () {

		//console.log ('\n --> Game has ended', rm.id );

		rm.isGameOn = false;

		if (rm.isTicking) rm.stopTimer ();

	}
	rm.resetGame = function () {

		//console.log ('--> Game has been restarted', rm.id + '\n' );

		//rm.initialTurn = rm.initialTurn == 0 ? 1 : 0;

		rm.turn = rm.turn == 0 ? 1 : 0;

		//rm.phase = 'prep';
		
		rm.isGameOn = true;

		rm.counter = 0;
		
		rm.createGrid ();

		if ( rm.isTimed ) rm.startTimer( rm.prepTime );

	}
	rm.switchTurn = function () {

		rm.turn = rm.turn == 0 ? 1 : 0;

	}
	rm.setGridTaken = function ( deep ) {

		rm.grid [deep].isTaken  = true;
		rm.grid [deep].resident  = rm.turn;
	}
	rm.setWinner = function () {
		//...

		var pid = rm.playerIDs [ rm.turn ];

		playerList [ pid ].winCount += 1;

		//console.log ('Winner : ' + playerList [pid].username );

	}
	return rm;

}

io.on('connection', function(socket){
	
	socketList[socket.id] = socket;
	
	socket.on("initUser", function (data) {
		
		var newPlayer = Player ( socket.id, data );

		newPlayer.pid = generatePlayersID ();

		playerList [ socket.id ] = newPlayer;	

		sendPlayersOnline ();

	});

	socket.on ('getInitData', function () {
		
		var pcount = Object.keys(socketList).length;

		var pid = playerList [ socket.id ].pid;

		socket.emit ( 'sendInitData', { 'count' : pcount, 'pid' : pid } );
		
	});

	socket.on("pair", function (data) {

		var player = playerList [socket.id];

		var opponentID = getPair ( data.code, socket.id );

		if ( opponentID != '' ) {

			var newRoomID = player.username + '_' + Date.now();
				
			var newRoom = GameRoom ( newRoomID, data.isTimed );
			
			newRoom.playerIDs.push ( socket.id );

			newRoom.playerCount += 1;

			newRoom.isClosed = true;

			roomList [ newRoomID ] = newRoom;

			player.roomid = newRoomID;

			var toReturn = {
				'isTimed' : data.isTimed,
				'invite' : player.username
			}
			
			playerList [opponentID].tmpRoom = newRoomID;

			socketList [opponentID].emit ('pairInvite', toReturn );

		} else {

			socket.emit ('pairingError', { 'error' : 1 } );
		}

	});

	socket.on("pairingResponse", function (data) {

		var player = playerList [socket.id];

		if ( roomList.hasOwnProperty ( player.tmpRoom ) ) {

			if ( !data ) {
				
				var room = roomList [ player.tmpRoom ];

				var invitee = room.playerIDs [0];

				leaveRoom ( invitee );

				player.tmpRoom = '';

				socketList [invitee].emit ('pairingError', { error : 0 } );

			} else {

				player.roomid = player.tmpRoom;

				player.index = 1;

				player.type = 1;

				var gameRoom = roomList [ player.roomid ];

				gameRoom.playerIDs.push ( socket.id );

				gameRoom.playerCount += 1;

				initGame ( gameRoom.id );

			}

		}else {

			player.tmpRoom = '';
			
			if ( data ) socket.emit ('pairingError', { 'error' : 2 });

		}

		

	});

	socket.on("enterGame", function (data) {
	
		var player = playerList [ socket.id ];

		if ( data.isSinglePlayer ) {

			var newRoomID = player.username + '_' + Date.now();

			var newRoom = GameRoom ( newRoomID, data.isTimed );
				
			newRoom.playerIDs.push ( socket.id )

			newRoom.isClosed = true;

			roomList [ newRoomID ] = newRoom;

			player.roomid = newRoomID;

			var returnData = {
			
				'isSinglePlayer' : true,
				'isTimed' : newRoom.isTimed,
				'blitzTime' : newRoom.blitzTime,
				'prepTime' : newRoom.prepTime,
				'players' : {
					'self' : {
						'name' : player.username,
						'type' : 0,
					}
				}
			};

			socket.emit ('initGame', returnData ); 

			//console.log ( '\n --> Room Created :', newRoom.id );


		}else {

			var availableRoom = getAvailableRoom( data.isTimed );

			if ( availableRoom == 'none' ) {

				var newRoomID = player.username + '_' + Date.now();
				
				var newRoom = GameRoom ( newRoomID, data.isTimed );
				
				newRoom.playerIDs.push ( socket.id );

				newRoom.playerCount += 1;

				roomList [ newRoomID ] = newRoom;

				player.roomid = newRoomID;

				//console.log ( '\n --> '+ player.username +' created a room :', newRoom.id );

			}else  {
				

				player.roomid = availableRoom;

				player.index = 1;

				player.type = 1;

				var gameRoom = roomList [ availableRoom ];

				gameRoom.playerIDs.push ( socket.id );

				gameRoom.playerCount += 1;

				//console.log ( '\n --> '+ player.username +' join the room :', gameRoom.id );
				
				//initialize game..
				initGame ( gameRoom.id );
		
			}

		}

			
	});

	socket.on("playerMove", function ( data ) {

		if ( verifyClickSent (socket.id) ) {

			//console.log ('--> Move received from ' + playerList[socket.id].username + ':', data  + '\n' );
			
			var plyr = playerList[socket.id];

			roomList [ plyr.roomid ].setGridTaken ( data );

			var oppoId = getOpponentsId ( socket.id );

			var oppoSocket = socketList [ oppoId ];

			oppoSocket.emit ( 'sendMoveToOpponent', data );

			analyzePlayersMove ( plyr.roomid, data );


		}else {

			console.log ('--> Click received is invalid. \n');
		}

	});
	
	socket.on("playerSendEmoji", function ( data ) {

		var player = playerList [ socket.id ];

		var room = roomList [ player.roomid ];

		for ( var i = 0; i < room.playerCount; i++ ) {

			var plyr =  ( room.playerIDs [i] == player.id ) ? 'self' : 'oppo';
			
			socketList [ room.playerIDs[i] ].emit ( 'showEmoji',  { 'plyr' : plyr, 'frame' : data });

		}

	});

	socket.on("rematchRequest", function () {
		
		var plyr = playerList [ socket.id ]
		
		plyr.isReadyForRematch = true;
		
		if ( bothPlayersRequestsRematch ( plyr.roomid ) ) {

			resetGame ( plyr.roomid );
		}

	});
	
	socket.on("leaveGame", function(data) {
		
		if ( playerList.hasOwnProperty(socket.id) ) {

			var plyr = playerList[socket.id];
			
			if ( plyr.roomid != '' )  leaveRoom ( socket.id );

		}

	});
	
	socket.on("disconnect",function () {
			
		if ( playerList.hasOwnProperty(socket.id) ) {

			var plyr = playerList[socket.id];

			//console.log ( '\n <-- ' + plyr.username  + ' has been disconnected.' );
			if ( plyr.tmpRoom != '' ) cancelPairing ( socket.id );

			if ( plyr.roomid != '' ) leaveRoom ( socket.id );
		
			delete playerList [socket.id];

		}

		delete socketList [socket.id];

		sendPlayersOnline();

	});

});


function cancelPairing () {
	//console.log ( 'this is called');
}
function getPair ( pcode, myID ) {

	for ( var i in playerList ) {

		var player = playerList [i];
		
		if ( player.pid == pcode && player.roomid == '' && player.tmpRoom == '' && i !== myID  ) return i;

	}
	return '';
}
function timeRanOut ( roomid ) {

	var room = roomList[roomid];

	//console.log ( '\n --> End Time :', playerList [ room.playerIDs [room.turn] ].username );

	if ( !room.isGameOn ) {

		for ( var i=0; i<room.playerCount; i++ ) {

			var self = playerList [ room.playerIDs[i] ];
			
			var turn = room.turn == i ? 'self' : 'oppo';
			
			var winner = turn == 'self' ? 'oppo' : 'self';

			var oppoID = getOpponentsId ( self.id );
	
			var oppoPieces = getPlayerPieces ( oppoID );
	
			var tmpSocket = socketList [ self.id ];
	
			tmpSocket.emit ('timeRanOut', { 'turn' : turn, 'winner' : winner, 'oppoPieces' : oppoPieces });
	
		}

	}
}
function getPlayerPieces ( playerid ) {

	var player = playerList [ playerid ];

	var pieces = [];

	for ( var i in player.pieces ) {
		pieces.push ({
			'cnt' : player.pieces[i].cnt,
			'rank' : player.pieces[i].rank
		});
	}

	return pieces;

}
function getAvailableRoom ( isTimed ) {

	for ( var i in roomList ) {
		if ( !roomList[i].isClosed && roomList[i].isTimed == isTimed ) return roomList[i].id;
	}
	return 'none';

}
function verifyClickSent ( socketid ) {

	var player = playerList [socketid];

	var gameRoom = roomList [ player.roomid ];

	if ( player.index != gameRoom.turn ) return false;

	return true;
}
function initGame ( roomid ) {

	var room = roomList [roomid];

	for ( var i = 0; i < room.playerCount; i++ ) {

		var self = playerList [ room.playerIDs[i] ];

		var oppo =  playerList [ room.playerIDs[ i == 0 ? 1 : 0 ] ];

		var turn  = ( i == room.turn ) ? 0 : 1;

		var data = {
			
			'isSinglePlayer' : false,
			'isTimed' : room.isTimed,
			'blitzTime' : room.blitzTime,
			'turn' : turn,
			'players' : {
				'self' : {
					'name' : self.username,
					'type' : self.type,
				},
				'oppo' : {
					'name' : oppo.username,
					'type' : oppo.type
				}
			}

		};

		var socket = socketList [ self.id ];

		socket.emit ('initGame', data );

	}

	room.initGame();

}
function bothPlayersRequestsRematch ( roomID ) {

	var gameRoom = roomList [roomID];

	for ( var i = 0; i < gameRoom.playerCount; i++ ) {

		var player = playerList [ gameRoom.playerIDs[i] ];

		if ( !player.isReadyForRematch ) return false;
	}

	return true;

}
function sendPlayersOnline () {
	
	var pcount = Object.keys(socketList).length;

	for ( var i in socketList ) {

		var socketa = socketList [i]; 

		socketa.emit ( 'playersOnline', pcount );

	}

}
function generatePlayersID () {

	var isUnique = false;

	var randID  = '';

	while ( !isUnique ) {

		var randID = Math.floor ( Math.random() * 99999 ) + 1000;

		isUnique = checkIsUnique ( randID ); 

	}

	return randID;

}
function checkIsUnique ( id ) {
	for ( var i in playerList ) {
		if ( playerList[i].pid == id ) return false;
	}
	return true;
}
function commenceGame ( roomID ) {

	var gameRoom = roomList[roomID];	

	gameRoom.commence();

	for ( var i=0; i<gameRoom.playerCount; i++) {

		var oppo = playerList [ gameRoom.playerIDs[ i == 0 ? 1 : 0 ] ];

		var turn  = ( i == gameRoom.turn ) ? 'self' : 'oppo';

		var oppoData = [];

		for ( var j in oppo.pieces ) {

			var post = oppo.index == 0 ? Math.abs ( oppo.pieces[j].post - 71 ) : oppo.pieces[j].post;

			oppoData.push ( {
				'post' : post,
				//'rank' : oppo.pieces[j].rank,
				'rank' : -1,
				'cnt' : oppo.pieces[j].cnt
			});

		}

		var data = {
			'turn' : turn,
			'oppoData' : oppoData,
		}

		var socket = socketList [ gameRoom.playerIDs[i] ];

		socket.emit ('commenceGame',  data );

	}

	

} 
function resetGame ( roomID ) {

	var gameRoom = roomList[roomID];

	for ( var i=0; i<gameRoom.playerCount; i++) {

		var player = playerList [ gameRoom.playerIDs[i] ];

		player.gameReset ();
		
		var socket = socketList [ gameRoom.playerIDs[i] ];

		socket.emit ('resetGame');
	}

	gameRoom.resetGame();

} 
function leaveRoom ( playerid ) {
	
	var player = playerList [playerid];

	var gameRoom = roomList [ player.roomid ];
		
	var oppoID = getOpponentsId ( playerid );

	if ( gameRoom.playerCount >= 2 ) {

		if ( gameRoom.isGameOn ) gameRoom.endGame ();

		gameRoom.playerIDs.splice ( player.index, 1 );

		gameRoom.playerCount = 1;

		var oppSocket = socketList [ oppoID ];
		
		oppSocket.emit ('opponentLeft', [] );
		
	} else {
		//...
		delete roomList [ player.roomid ];

		//console.log ( '\n <-- Room deleted :', gameRoom.id  );

	}
	

	player.resetAll ();
	
}
function getWinner () {
	//..
}
function getOpponentsId ( playerid ) {
	
	var plyr = playerList[playerid];
	
	if ( plyr.roomid != '' ) {
		
		var oppIndex = ( plyr.index == 0 ) ? 1 : 0;
		
		return roomList[ plyr.roomid ].playerIDs[ oppIndex ];
	}

	return '';

}
function analyzePlayersMove ( roomid, pos ) {

	var room = roomList [ roomid ];

	if ( isWinner ( room.turn, roomid, pos ) ) {

		//console.log ('isWinner');

		room.setWinner ();

	}else {

		//console.log ('switchTurn');
		
		room.switchTurn ();
	}

}
//checker..
function isWinner ( turn, roomid, pos ) {
	
	var tempStr = turn == 0 ? '0000' : '1111';

	var verStr = checkVertical ( roomid, pos );
	var horStr = checkHorizontal ( roomid, pos );
	var bacStr = checkBackSlash ( roomid, pos );
	var forStr = checkForwardSlash ( roomid, pos) ;

	var win = verStr.includes (tempStr) || horStr.includes (tempStr) || bacStr.includes (tempStr) || forStr.includes (tempStr) ;

	return win; 
		
}
function checkVertical ( roomid, gp ) {

	var room = roomList [ roomid ];

	var r = room.grid[gp].row,
		c = room.grid[gp].col;

	var tmpR = r;

	var str = "";

	while ( tmpR <= 5 ) {
		
		var tmpPos = ( tmpR * 7 ) + c;

		tmpR += 1;

		str += room.grid [tmpPos].resident.toString();

	}

	return str;

}
function checkHorizontal ( roomid, gp ) {

	var room = roomList [ roomid ];

	var r = room.grid[gp].row,
		c = room.grid[gp].col;

	var tmpC = 0;

	var str = "";

	while ( tmpC <= 6 ) {

		var tmpPos = ( r * 7 ) + tmpC;

		tmpC += 1;

		str += room.grid [tmpPos].resident.toString();

	}

	return str;

}
function checkBackSlash ( roomid, gp ) {

	var room = roomList [ roomid ];

	var r = room.grid[gp].row,
		c = room.grid[gp].col;

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

		str += room.grid [tmpPos].resident.toString();

	}

	return str;

}
function checkForwardSlash ( roomid, gp ) {

	var room = roomList [ roomid ];

	var r = room.grid[gp].row,
		c = room.grid[gp].col;

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

		str += room.grid [tmpPos].resident.toString();

	}

	return str;

}

//............