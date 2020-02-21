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
const Moves = {
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down'
};
const cycleIndex = 0;
const boardIndex = 0;
let gameData = {};

// A node in a maze.
class MazeNode {
    constructor() {
        this.visited = false;
        this.canGoRight = false;
        this.canGoDown = false;
    }
}

// A randomly generated maze half the size of the board.
// Uses prims algorithm.
class Maze {
    constructor(game) {
        this.game = game;
        this.nodes = [];
        for(let i = 0; i < game.board.height * game.board.width/4; i++) {
            this.nodes.push(new MazeNode());
        }
    }

    markVisited(x, y) {
        this.nodes[x+y*this.game.board.width/2].visited = true;
    }

    markCanGoDown(x, y) {
        this.nodes[x+y*this.game.board.width/2].canGoDown = true;
    }

    markCanGoRight(x, y) {
        this.nodes[x+y*this.game.board.width/2].canGoRight = true;
    }

    canGoRight(x, y) {
        return this.nodes[x+y*this.game.board.width/2].canGoRight;
    }

    canGoDown(x, y) {
        return this.nodes[x+y*this.game.board.height/2].canGoDown;
    }

    canGoLeft(x, y) {
        if(x == 0) return false;
        return this.nodes[(x-1)+y*this.game.board.width/2].canGoRight;
    }

    canGoUp(x, y) {
        if(y == 0) return false;
        return this.nodes[x+(y-1)*this.game.board.width/2].canGoDown;
    }

    isVisited(x, y) {
        return this.nodes[x+y*this.game.board.width/2].visited;
    }

    // Recursively generate the maze.
    generation(fromx, fromy, x, y) {
        if(x < 0 || y < 0 || x >= this.game.board.width/2 || y >= this.game.board.height/2) return;
        if(this.isVisited(x, y)) return;
        this.markVisited(x, y);

        if(fromx != -1) {
            if(fromx < x) {
                this.markCanGoRight(fromx, fromy);
            } else if(fromx > x) {
                this.markCanGoRight(x, y);
            } else if(fromy < y) {
                this.markCanGoDown(fromx, fromy);
            } else if(fromy > y) {
                this.markCanGoDown(x, y);
            }
        }

        // Want to visit all four nodes randomly. Pick two
        // randomly then visit all four. Duplicate nodes will
        // be ignored.
        for(let i = 0; i < 2; i++) {
            let randomNode = Math.floor(Math.random()*4);
            switch(randomNode) {
                case 0: this.generation(x, y, x-1, y); break;
                case 1: this.generation(x, y, x+1, y); break;
                case 2: this.generation(x, y, x, y-1); break;
                case 3: this.generation(x, y, x, y+1); break;
            }
        }
        this.generation(x, y, x-1, y);
        this.generation(x, y, x+1, y);
        this.generation(x, y, x, y-1);
        this.generation(x, y, x, y+1);

    }
}

// Contains the path to follow.
class HamCycle {
    constructor(game) {
        this.hamiltonianCycle = [];
        this.game = game;
        this.maze = new Maze(game);
        this.maze.generation(-1,-1,0,0);
        this.generateHamiltonianCycle();
    }

    generateHamiltonianCycle() {
        x = 0;
        y = 0;
        direction = this.maze.canGoDown(x,y) ? Moves.UP : Moves.LEFT;
        hamCycleIndex = 0;
        do {
            nextDirection = this.findNextDirection(x,y,direction);
            switch(direction) {
                case Moves.RIGHT:
                    this.setTourNumber(x*2,y*2,hamCycleIndex++);
                    // HERE
            }
        } while(hamCycleIndex != this.game.board.width*this.game.board.height);
    }

    setTourNumber(x,y,hamCycleIndex) {
        if(this.getPathNumber(x,y) != 0) return;
        this.hamiltonianCycle[x+y*this.game.board.width] = hamCycleIndex;
    }

    getPathNumber(x, y) {
        return this.hamiltonianCycle[x+y*this.game.board.width];
    }

    findNextDirection(x,y,direction) {
        if(direction == Moves.UP) {
            if(this.maze.canGoUp(x,y)) {
                return Moves.UP;
            }
            if(this.maze.canGoRight(x,y)) {
                return Moves.RIGHT;
            }
            if(this.maze.canGoDown(x,y)) {
                return Moves.DOWN;
            }
            return Moves.LEFT;
        } else if(direction == Moves.DOWN) {
            if(this.maze.canGoRight(x,y)) {
                return Moves.RIGHT;
            }
            if(this.maze.canGoDown(x,y)) {
                return Moves.DOWN;
            }
            if(this.maze.canGoLeft(x,y)) {
                return Moves.LEFT;
            }
            return Moves.UP;
        } else if(direction == Moves.LEFT) {
            if(this.maze.canGoDown(x,y)) {
                return Moves.DOWN;
            }
            if(this.maze.canGoLeft(x,y)) {
                return Moves.LEFT;
            }
            if(this.maze.canGoUp(x,y)) {
                return Moves.UP;
            }
            return Moves.RIGHT;
        } else if(direction == Moves.RIGHT) {
            if(this.maze.canGoLeft(x,y)) {
                return Moves.LEFT;
            }
            if(this.maze.canGoUp(x,y)) {
                return Moves.UP;
            }
            if(this.maze.canGoRight(x,y)) {
                return Moves.RIGHT;
            }
            return Moves.DOWN;
        }
        throw Error("Unreachable direction.");
    }
}

// Make sure snake is alive (responding to requests).
app.post('/ping', (request, response) => {
    return response.status(200).json({});
});

// Start of a game. Return snake options.
app.post('/start', (request, response) => {
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
