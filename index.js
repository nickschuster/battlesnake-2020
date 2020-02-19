// Logger
const log = require('morgan');

// Handle all incoming requests
const express = require('express');
const app = express();

app.set('port', (80));

app.enable('verbose errors');

app.use(log('dev'));
app.use(express.json());

// Make sure snake is alive (responding to requests).
app.post('/ping', (request, response) => {
    return response.status(200).json({});
});

// Start of a game. Return snake options.
app.post('/start', (request, response) => {
    const snake = {
        color: '#DFFF00',
        headType: 'dead',
        tailType: 'bolt'
    };
    console.log('Game starting.');
    return response.status(200).json(snake);
});

// Ask for move. Get 500 ms to repond with up,left,right,down.
app.post('/move', (request, response) => {
    return response.status(200).json({'move': 'left'});
});

// Game has ended.
app.post('/end', (request, response) => {
    return response.status(200).json({});
});

app.listen(app.get('port'), () => {
    console.log(`Listening: ${app.get('port')}.`);
});
