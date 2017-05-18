(function() {

    const socket = io.connect(),
        joinForm = $("#join-form"),
        currentRoom = $("#currentRoom"),
        nick = $("#nick"),
        chatForm = $("#chat-form"),
        chatWindow = $("#chat-window"),
        changeNickForm = $("#changeNick-form"),
        createRoomForm = $("#createRoom-form"),
        chatMessage = $("#message"),
        newNickname = $('#changeNick-newNick'),
        newRoomname = $('#createRoom-newRoom'),
        chat = $("#chat"),
        usersList = $('#usersList'),
        roomsList = $('#roomsList'),
        chatStatusTpl = Handlebars.compile($('#chat-status-template').html()),
        chatMessageTpl = Handlebars.compile($('#chat-message-template').html()),
        chatWarningTpl = Handlebars.compile($('#chat-warning-template').html()),
        usersListTpl = Handlebars.compile($('#user-list-template').html()),
        roomListTpl = Handlebars.compile($('#room-list-template').html());

    let joined = false;

    chatMessage.keypress(e => {

        if(e.keyCode != 13) return;

        chatForm.submit();
        return false;

    });


    roomsList.on('click', e => {

        if(!e.target.className.includes('btn-join')) return;

        socket.emit('changeroom', e.target.id);

    });

    joinForm.on("submit", e => {

        e.preventDefault();

        const nickName = validDataFromUser(nick.val(), 2, 25);

        if(nickName) {

            nick.removeClass("invalid");
            socket.emit('join', nickName, 'Lobby');
            
        } else {

            nick.addClass("invalid");
        }

    });

    chatForm.on("submit", e => {

        e.preventDefault();

        const message = validDataFromUser(chatMessage.val(), 0);

        if(!message) return;

        socket.emit('message', message);

        chatMessage.val("");

    });

    changeNickForm.on("submit", e => {

        e.preventDefault();

        const newNick = validDataFromUser(newNickname.val(), 2, 15);

        if(newNick) {

            socket.emit('changenick', newNick);

        } else {

            const html = chatWarningTpl({
                warning: "You use the wrong amount of characters.",
                time: formatTime(Date.now())
            });

            chatWindow.append(html);
        }

        newNickname.val("");

    });

    createRoomForm.on("submit", e => {

        e.preventDefault();

        const newRoom = validDataFromUser(newRoomname.val(), 2, 15);

        if(newRoom) {

            socket.emit('createroom', newRoom);

        } else {

            const html = chatWarningTpl({
                warning: "You use the wrong amount of characters.",
                time: formatTime(Date.now())
            });

            chatWindow.append(html);
            return;
        }

        newRoomname.val("");

    });

    socket.on('join', data => {

        if(data.success) {

            joinForm.hide();
            chat.show();

            joined = true;

        } else {

            let html = '<p class="chat-warning">' + data.status + '</p>';

            joinForm.append(html);
        }  

    });

    socket.on('warning', data => {

        const html = chatWarningTpl({
            warning: data.warning,
            time: formatTime(data.time)
        });

        chatWindow.append(html);
        scrollToBottom();

    });

    socket.on('status', data => {
        
        if(!joined) return;

        const html = chatStatusTpl({
            status: data.status,
            time: formatTime(data.time)
        });

        chatWindow.append(html);
        socket.emit('generateUsersList'); 

        scrollToBottom();
    });

    socket.on('message', data => {

        if(!joined) return;
       
        const html = chatMessageTpl({
            status: data.status,
            nick: data.nick,
            time: formatTime(data.time)
        });
        
        chatWindow.append(html);
        scrollToBottom();
    });

    socket.on('getRoomsList', () => socket.emit('generateRoomsList'));

    socket.on('generateRoomsList', data => {
        
        let html = "";
        
        data.forEach(room => {

            html += roomListTpl({
                name: room.name,
                number: room.numberOfUsers
            });

        });

        roomsList.html(html);

    });

    socket.on('changeroom', data => currentRoom.text(data.room));

    socket.on('generateUsersList', data => {
        
        let html = "";

        data.forEach(user => {

            html += usersListTpl({
                nick: user.nick
            });

        });

        usersList.html(html);
    });

    function validDataFromUser(data, minLength, maxLength) {

        data = $.trim(data);

        if(data.length < minLength) return false;
        
        if(maxLength && maxLength < data.length) return false;

        return data;
    }

    function scrollToBottom() {

        chatWindow.scrollTop(chatWindow.prop("scrollHeight"));
    }

    function formatTime(time) {

        const date = new Date(time),
            hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds();

        return (hours < 10 ? "0" + hours : hours) + ":" +
            (minutes < 10 ? "0" + minutes : minutes) + ":" +
            (seconds < 10 ? "0" + seconds : seconds);
    }

})();