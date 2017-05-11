const users = [];

function init(io) {

	io.on('connection', function(socket) {

		socket.on('join', function(nick) {

			const result = users.find(function(user) {
				return user.nick === nick;
			});

			if(result) {

				io.to(socket.id).emit('join', {
					success: false,
					status: nick + " is used. Choose other nickname."
				});

			} else {

				socket.nick = nick;
				users.push({
					id: socket.id,
					nick: socket.nick
				});
				
				io.to(socket.id).emit('join', {
					success: true
				});

				io.emit('status', {
					time: Date.now(),
					status: nick + " joined to the room."
				});

			}

		}); 

		socket.on('disconnect', function() {

			io.emit('status', {
				time: Date.now(),
				status: socket.nick + " left the room."
			});

			let index = users.findIndex(function(user){
				return user.nick === socket.nick;
			});

			users.splice(index, 1);

		});

		socket.on('message', function(msg) {

			io.emit('message', {
				time: Date.now(),
				nick: socket.nick,
				status: msg
			});

		});

		socket.on('changenick', function(newNick) {

			const result = users.find(function(user) {
				return user.nick === newNick;
			});

			if(result) {

				io.to(socket.id).emit('warning', {
					warning:  newNick + " is used. Choose other nick", 
					time: Date.now()
				});

			} else {

				let oldNick = socket.nick;
				socket.nick = newNick;

				let index = users.findIndex(function(user){
					return user.nick === oldNick;
				});

				users.splice(index, 1);

				users.push({
					id: socket.id,
					nick: socket.nick
				});


				io.emit('status', {
					time: Date.now(),
					status: oldNick + " has changed nick to " + newNick
				});

			}

		});

	});

}

module.exports = init;