// Logger
const log = require('morgan');

// Handle all incoming requests
const express = require('express');
const app = express();

app.set('port', (9001));

app.enable('verbose errors');

app.use(log('dev'));
app.use(express.json());

// Game variables.
const snake = {
    color: '#DFFF00',
    headType: 'dead',
    tailType: 'bolt'
};
const cycleIndex = 0;
const boardIndex = 0;
let gameData = {};


class Node {
    constructor() {
        this.visited = false;
        this.canGoRight = false;
        this.canGoLeft = false;
    }
}
class Maze {
    constructor(game) {
        let nodes = [];
        for(let i = 0; i < game.board.height/2; i++) {
            nodes.push(new Node());
        }
    }
}

class HamCycle {
    constructor(game) {
        this.maze = new Maze(game);
        this.game = game;
    }
}

// Make sure snake is alive (responding to requests).
app.post('/ping', (request, response) => {
    return response.status(200).json({});
});

// Start of a game. Return snake options.
app.post('/start', (request, response) => {
    console.log('Game starting.');
    console.log(request);
    gameData[request.body.game.id] = [new HamCycle(request.body)];
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

// Listen on port.
app.listen(app.get('port'), () => {
    console.log(`Listening: ${app.get('port')}.`);
});
