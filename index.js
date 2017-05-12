const express = require("express"),
    app = express(),
    server = require("http").Server(app),
    hbs = require("express-handlebars"),
    chat = require("./chat"),
    io = require("socket.io")(server);

app.engine("handlebars", hbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.use(express.static("public"));

app.get("/", (req, res) =>  {

    res.render("home", {
        title: "Chat",
        styles: [
            "bootstrap.css",
            "custom.css"
        ],
        scripts: [
            "jquery.js",
            "handlebars.js",
            "socket.io.js",
            "chat.js"
        ]
    });
});

server.listen(process.env.PORT || 8080, () => console.log("Server listening on port 8080."));

chat(io);