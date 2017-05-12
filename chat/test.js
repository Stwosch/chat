function init(io) {

    const users = [];

    io.on('connection', function(socket) {

        users.push(socket.id);

        io.emit('notifyToGetAllUsers');

        socket.on('getAllUsers', function() {

            io.to(socket.id).emit('getAllUsers', users);

        });

    });
}


module.exports = init;