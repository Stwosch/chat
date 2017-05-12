const xss = require('xss');

function init(io) {

	const users = [];

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

			// Assign nick and add to users array

			socket.nick = nick;

			users.push({
				nick: socket.nick,
				room: room
			});

			// Get index from users array

			const usersIndex = users.findIndex(user => user.nick === socket.nick);

			socket.usersIndex = usersIndex;

			// Joining to chat
				
			socket.join(room);
			socket.room = room;
			users[socket.usersIndex].room = room

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

		}); 

		socket.on('disconnect', () => {

			// Notify others you left

			io.to(socket.room).emit('status', {
				time: Date.now(),
				status: socket.nick + " left the room."
			});

			// Remove from users array

			users.splice(socket.usersIndex, 1);

		});

		socket.on('message', msg => {

			io.to(socket.room).emit('message', {
				time: Date.now(),
				nick: socket.nick,
				status: msg
			});

		});

		socket.on('changeroom', room => {

			room = validDataFromUser(room);

			// Check is it the same room

			if(socket.room === room) return;

			// Notify others you left

			socket.broadcast.to(socket.room).emit('status', {
				time: Date.now(),
				status: socket.nick + " changed the room."	
			});

			// Leave, join, save informations

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

}

module.exports = init;