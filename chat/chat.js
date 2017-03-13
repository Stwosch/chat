function init(io) {

	io.on('connection', function(socket) {

		socket.on('join', function(nick) {

			socket.nick = nick;

			io.emit('status', {
				time: Date.now(),
				status: nick + " dołączył do czatu."
			});
		});

		socket.on('disconnect', function() {

			io.emit('status', {
				time: Date.now(),
				status: socket.nick + " opuścił czat."
			});

		});

		socket.on('message', function(msg) {

			io.emit('message', {
				time: Date.now(),
				nick: socket.nick,
				status: msg
			});

		});

	});

}

module.exports = init;