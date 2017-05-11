const namesUsed = [];

function init(io) {

	io.on('connection', function(socket) {

		socket.on('join', function(nick) {

			socket.nick = nick;

			io.emit('status', {
				time: Date.now(),
				status: nick + " joined to the room."
			});
		}); 

		socket.on('disconnect', function() {

			io.emit('status', {
				time: Date.now(),
				status: socket.nick + " left the room."
			});

		});

		socket.on('message', function(msg) {

			io.emit('message', {
				time: Date.now(),
				nick: socket.nick,
				status: msg
			});

		});

		socket.on('changenick', function(newNick) {

			let oldNick = socket.nick;
			socket.nick = newNick;

			io.emit('status', {
				time: Date.now(),
				status: oldNick + " has changed nick to " + newNick
			});

		});

	});

}

module.exports = init;