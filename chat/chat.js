const xss = require('xss'),
	User = require('./User.class'),
	Room = require('./Room.class');

function init(io) {

	const users = [],
		rooms= [
			new Room('Lobby', 0)
		];

	io.on('connection', socket => {

		socket.on('join', nick => {

			nick = validDataFromUser(nick);
			const room = 'Lobby';

			// Check nick is free

			const nickUsed = users.find(user =>  user.nick === nick);

			// Nick already used, choose other

			if(nickUsed) {

				io.to(socket.id).emit('join', {
					success: false,
					status: nick + " is used. Choose other nickname."
				});

				return;
			} 

			// Add one more user in Lobby

			const index = rooms.findIndex(room => room.name === 'Lobby');

			rooms[index].numberOfUsers += 1;

			// Assign nick and add to users array

			socket.nick = nick;
			users.push(new User(socket.id, socket.nick, room));

			// Get index from users array

			const usersIndex = users.findIndex(user => user.nick === socket.nick);
			socket.usersIndex = usersIndex;

			// Joining to chat
				
			socket.join(room);
			socket.room = room;

			socket.broadcast.to(socket.room).emit('status', {
				time: Date.now(),
				status: socket.nick + " joined to the room."	
			});

			// Response successful

			io.to(socket.id).emit('join', {
				success: true
			});

			// Get users list and notify yourself

			io.to(socket.id).emit('status', {
				time: Date.now(),
				status: "You have joined to chat."
			});

			// Get rooms list

			io.emit('getRoomsList');

		}); 

		socket.on('generateRoomsList', () => {

			// Get rooms with users

			const availableRooms = rooms.filter(room => room.numberOfUsers > 0);

			// Always get Lobby

			if(availableRooms) {

				const lobby = availableRooms.find(aRoom => aRoom.name === 'Lobby');

				if(lobby === undefined) {
				 	
					 availableRooms.unshift(new Room('Lobby', 0));
				} 

			} else {

				availableRooms.unshift(new Room('Lobby', 0));
			}

			io.emit('generateRoomsList', availableRooms);

		});

		socket.on('disconnect', () => {

			// Notify others you left

			io.to(socket.room).emit('status', {
				time: Date.now(),
				status: socket.nick + " left the room."
			});

			// Remove from users array

			users.splice(socket.usersIndex, 1);

			// Remove from room array

			const index = rooms.findIndex(room => room.name === socket.room);

			if(index === undefined || index === -1) return;

			if(rooms[index].numberOfUsers <= 1 && rooms[index].name !== 'Lobby') {

				rooms.splice(index, 1);

			} else {

				rooms[index].numberOfUsers -= 1;
			}

			// Get room list

			io.emit('getRoomsList');

		});

		socket.on('message', msg => {

			io.to(socket.room).emit('message', {
				time: Date.now(),
				nick: socket.nick,
				status: msg
			});

		});

		socket.on('createroom', room => {

			room = validDataFromUser(room);

			const roomExists = rooms.findIndex(existingRoom => existingRoom.name === room);

			if(roomExists !== -1) {
				
				io.to(socket.id).emit('warning', {
					time: Date.now(),
					warning: "This room already exists."	
				});

			} else {

				changeRoom(socket, room);
			}

		});

		socket.on('changeroom', room => {

			changeRoom(socket, room);

		});

		socket.on('changenick', newNick => {

			newNick = xss(newNick);

			// Check is it free

			const result = users.find(user => user.nick === newNick);

			// Notify yourself that you can't use this nick

			if(result) {

				io.to(socket.id).emit('warning', {
					warning:  newNick + " is used. Choose other nick", 
					time: Date.now()
				});

				return;
			} 

			// Change informations

			const oldNick = socket.nick;
			socket.nick = newNick;

			users[socket.usersIndex].nick = socket.nick;

			// Notify others

			io.to(socket.room).emit('status', {
				time: Date.now(),
				status: oldNick + " has changed nick to " + newNick
			});

		});

		socket.on('generateUsersList', () => {

			const usersInRoom = users.filter(user => socket.room === user.room);

			io.to(socket.id).emit('generateUsersList', usersInRoom);

		});

	});

	function validDataFromUser(data) {

		return xss(data);
	}

	function changeRoom(socket, room) {

		room = validDataFromUser(room);

		// Check is it the same room

		if(socket.room === room) return;

		// Notify others you left

		socket.broadcast.to(socket.room).emit('status', {
			time: Date.now(),
			status: socket.nick + " changed the room."	
		});

		// Leave, join, save informations

		rooms.push(new Room(room, 0));

		replaceUsersChangeRoom(socket.room, room);

		socket.leave(socket.room);
		socket.join(room);
		socket.room = room;

		users[socket.usersIndex].room = room;

		// Notify others you joined
		
		socket.broadcast.to(socket.room).emit('status', {
			time: Date.now(),
			status: socket.nick + " joined to the room."	
		});

		// Notify yourself

		io.to(socket.id).emit('status', {
			time: Date.now(),
			status: "You changed to the '" + socket.room + "' room."	
		});

		// Change bilboard
		
		io.to(socket.id).emit('changeroom', {
			room: socket.room
		});

		// Get rooms list

		io.emit('getRoomsList');
	}

	function replaceUsersChangeRoom(from, to) {

		const indexFrom = rooms.findIndex(room => room.name === from);
		
		if(rooms[indexFrom].numberOfUsers > 1 || rooms[indexFrom].name === 'Lobby') {

			rooms[indexFrom].numberOfUsers -= 1;

		} else if(rooms[indexFrom].name !== 'Lobby') {

			rooms.splice(indexFrom, 1);

		}

		const indexTo = rooms.findIndex(room => room.name === to);
		rooms[indexTo].numberOfUsers += 1;

	}

}

module.exports = init;