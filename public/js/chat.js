(function() {

    const socket = io.connect(),
        joinForm = $("#join-form"),
        nick = $("#nick"),
        chatForm = $("#chat-form"),
        chatWindow = $("#chat-window"),
        chatMessage = $("#message"),
        chatStatusTpl = Handlebars.compile($('#chat-status-template').html()),
        chatMessageTpl = Handlebars.compile($('#chat-message-template').html()),
        chatWarningTpl = Handlebars.compile($('#chat-warning-template').html());

    let joined = false;

    chatMessage.keypress(function(e) {

        if(e.keyCode != 13) return;

        chatForm.submit();
        return false;

    });


    joinForm.on("submit", function(e) {

        e.preventDefault();

        let nickName = $.trim( nick.val() );

        if(nickName === "") {

            nick.addClass("invalid");
        } else {

            nick.removeClass("invalid");
            socket.emit('join', nickName);
        }

    });

    chatForm.on("submit", function(e) {

        e.preventDefault();

        let message = $.trim( chatMessage.val() );

        sendingMessage(message);

    });

    socket.on('join', function(data) {

        if(data.success) {

            joinForm.hide();
            chatForm.show();

            joined = true;

        } else {

            let html = '<p class="chat-warning">' + data.status + '</p>';

            joinForm.append(html);
        }  

    });

    socket.on('warning', function(data) {

        const html = chatWarningTpl({
            warning: data.warning,
            time: formatTime(data.time)
        });

        chatWindow.append(html);
        scrollToBottom();

    });

    socket.on('status', function(data) {
        
        if(!joined) return;

        const html = chatStatusTpl({
            status: data.status,
            time: formatTime(data.time)
        });

        chatWindow.append(html);
        scrollToBottom();
    });

    socket.on('message', function(data) {

        if(!joined) return;
       
        const html = chatMessageTpl({
            status: data.status,
            nick: data.nick,
            time: formatTime(data.time)
        });
        
        chatWindow.append(html);
        scrollToBottom();
    });

    function sendingMessage(message) {

        if(message[0] === "/") {

            callCommand(message);

        } else if(message !== "") {
        
            socket.emit('message', message);
        }

        chatMessage.val("");
    }

    function callCommand(command) {

        let commandOptions = command.split(" ");
        let commandType = commandOptions[0].slice(1); // Removing "/"

        switch(commandType) { 

            case "chnick": 

                if(commandOptions.length !== 2) {

                    const html = chatWarningTpl({
                        warning: "You used wrong number of parameters. Command '/" + commandType + "' needs 1 parameter.",
                        time: formatTime(Date.now())
                    });

                    chatWindow.append(html);
                    return;
                }

                socket.emit('changenick', commandOptions[1]);

            break;

            default:

                const html = chatWarningTpl({
                    warning: "This command doesn't exist",
                    time: formatTime(Date.now())
                });

                chatWindow.append(html);

        }
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