/**
 * @file     app.js
 * @author   charles-Antoine Gagnon
 * @version  1
 * @date     18/09/2025
 * @brief    Première ébauche d'une architecture générique "RESTful" avec Express
 */
const PORT = 8080;
var express = require('express');
const http = require('http');

var app = express();
const server = http.createServer(app);

// Initialiser le flux vidéo RTSP
const videoStream = require('./models/videoStream');
const
{
    scriptUrl
} = videoStream.initializeVideoStream(app, server);

// Rendre scriptUrl disponible pour les routes
app.set('rtspRelay',
{
    scriptUrl
});

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded(
{
    extended: false
}));

// Créer Socket.IO
const io = require('socket.io')(server);

// Initialiser MQTT avec Socket.IO - Dashboard principal
const mqttHandler = require('./models/mqtt');
mqttHandler.initializeSocketIO(io);

// Initialiser les 6 handlers MQTT pour chaque Raspberry Pi
const mqtt1 = require('./models/mqtt1');
const mqtt2 = require('./models/mqtt2');
const mqtt3 = require('./models/mqtt3');
const mqtt4 = require('./models/mqtt4');
const mqtt5 = require('./models/mqtt5');
const mqtt6 = require('./models/mqtt6');

mqtt1.initializeSocketIO(io);
mqtt2.initializeSocketIO(io);
mqtt3.initializeSocketIO(io);
mqtt4.initializeSocketIO(io);
mqtt5.initializeSocketIO(io);
mqtt6.initializeSocketIO(io);

// Exporter maintenant pour que routes/index.js puisse lire io
module.exports = {
    app,
    server,
    io
};
app.use(require('./routes/index'));

app.use(require('./routes/contacts'));
app.use(require('./routes/dashBoard'));
app.use(require('./routes/raspberrypi'));
app.use(require('./routes/camera'));
app.use(function (req, res, next)
{
    res.status(404)
    res.render("pages/404.ejs");
});

server.listen(PORT, function ()
{
    console.log('Server is running on port ' + PORT);
});

// gestion des erreurs
app.use(function (err, req, res, next)
{
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err :
    {};

    // afficher la page d’erreurs
    res.status(err.status || 500);
    res.render('error');
});
