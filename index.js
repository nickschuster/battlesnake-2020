// Logger
const log = require('morgan');

// Handle all incoming requests
const express = require('express');
const app = express();

app.set('port', (process.env.PORT || 9001));

app.enable('verbose errors');

app.use(log('dev'));
app.use(express.json());

// Make sure snake is alive (responding to requests).
app.post('/ping', (request, response) => {
    return response.json({});
});

// Start of a game. Return snake options.
app.post('/start', (request, response) => {
    const snake = {
        color: '#DFFF00'
    };
    return response.json(snake);
});

// Ask for move. Get 500 ms to repond with up,left,right,down.
app.post('/move', (request, response) => {
    return response.json({'move': 'up'});
});

// Game has ended.
app.post('/end', (request, response) => {
    return response.json({});
});

app.listen(app.get('port'), () => {
    console.log(`Listening: ${app.get('port')}.`);
});
