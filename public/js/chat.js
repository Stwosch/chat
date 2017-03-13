(function() {

    var socket = io.connect(),
        joined = false;

    var joinForm = $("#join-form"),
        nick = $("#nick"),
        chatForm = $("#chat-form"),
        chatWindow = $("#chat-window"),
        chatMessage = $("#message"),
        chatStatusTpl = Handlebars.compile($('#chat-status-template').html()),
        chatMessageTpl = Handlebars.compile($('#chat-message-template').html());

    joinForm.on("submit", function(e) {

        e.preventDefault();

        var nickName = $.trim( nick.val() );

        if(nickName === "") {
            nick.addClass("invalid");
        } else {
            nick.removeClass("invalid");

            socket.emit('join', nickName);

            joinForm.hide();
            chatForm.show();

            joined = true;
        }

    });

    chatForm.on("submit", function(e) {

        e.preventDefault();

        var message = $.trim( chatMessage.val() );

        if(message !== "") {
            socket.emit('message', message);
            chatMessage.val("");
        }

    });

    socket.on('status', function(data) {
        
        if(!joined) return;

        var html = chatStatusTpl({
            status: data.status,
            time: formatTime(data.time)
        });

        chatWindow.append(html);
        scrollToBottom();
    });

    socket.on('message', function(data) {

        if(!joined) return;
       
        var html = chatMessageTpl({
            status: data.status,
            nick: data.nick,
            time: formatTime(data.time)
        });
        
        chatWindow.append(html);
        scrollToBottom();
    });

    function scrollToBottom() {

        chatWindow.scrollTop(chatWindow.prop("scrollHeight"));
    }

    function formatTime(time) {

        var date = new Date(time),
            hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds()

        return (hours < 10 ? "0" + hours : hours) + ":" +
            (minutes < 10 ? "0" + minutes : minutes) + ":" +
            (seconds < 10 ? "0" + seconds : seconds);
    }

})();