// Logger
const log = require('morgan');

// Handle all incoming requests
const express = require('express');
const app = express();

// File writing for debugging.
const fs = require('fs');

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
        for(let i = 0; i < Math.floor((game.board.height * game.board.width)/4); i++) {
            this.nodes.push(new MazeNode());
        }
    }

    markVisited(x, y) {
        this.nodes[Math.floor(x+y*this.game.board.width/2)].visited = true;
    }

    markCanGoDown(x, y) {
        this.nodes[Math.floor(x+y*this.game.board.width/2)].canGoDown = true;
    }

    markCanGoRight(x, y) {
        this.nodes[Math.floor(x+y*this.game.board.width/2)].canGoRight = true;
    }

    canGoRight(x, y) {
        return this.nodes[Math.floor(x+y*this.game.board.width/2)].canGoRight;
    }

    canGoDown(x, y) {
        return this.nodes[Math.floor(x+y*this.game.board.width/2)].canGoDown;
    }

    canGoLeft(x, y) {
        if(x == 0) return false;
        return this.nodes[Math.floor((x-1)+y*this.game.board.width/2)].canGoRight;
    }

    canGoUp(x, y) {
        if(y == 0) return false;
        return this.nodes[Math.floor(x+(y-1)*this.game.board.width/2)].canGoDown;
    }

    isVisited(x, y) {
        return this.nodes[Math.floor(x+y*this.game.board.width/2)].visited;
    }

    // Recursively generate the maze.
    generation(fromx, fromy, x, y) {
        if(x < 0 || y < 0 || x >= Math.floor(this.game.board.width/2) || y >= Math.floor(this.game.board.height/2)) return;
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
        for(let i = 0; i < game.board.width * game.board.height; i++) {
            this.hamiltonianCycle[i] = 0;
        }
        this.game = game;
        this.maze = new Maze(game);
        this.maze.generation(-1, -1, 0, 0);
        this.generateHamiltonianCycle();
    }

    generateHamiltonianCycle() {
        let x = 0;
        let y = 0;
        let direction = this.maze.canGoDown(x, y) ? Moves.UP : Moves.LEFT;
        let hamCycleIndex = 0;
        do {
            let nextDirection = this.findNextDirection(x, y, direction);
            switch(direction) {
                case Moves.RIGHT:
                    this.setHamCycleNumber(x*2, y*2, hamCycleIndex++);
                    if(nextDirection == direction || nextDirection == Moves.DOWN || nextDirection == Moves.LEFT) {
                        this.setHamCycleNumber(x*2+1, y*2, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.DOWN || nextDirection == Moves.LEFT) {
                        this.setHamCycleNumber(x*2+1, y*2+1, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.LEFT) {
                        this.setHamCycleNumber(x*2, y*2+1, hamCycleIndex++);
                    }
                    break;
                case Moves.DOWN:
                    this.setHamCycleNumber(x*2+1, y*2, hamCycleIndex++);
                    if(nextDirection == direction || nextDirection == Moves.LEFT || nextDirection == Moves.UP) {
                        this.setHamCycleNumber(x*2+1, y*2+1, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.LEFT || nextDirection == Moves.UP) {
                        this.setHamCycleNumber(x*2, y*2+1, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.UP) {
                        this.setHamCycleNumber(x*2, y*2, hamCycleIndex++);
                    }
                    break;
                case Moves.LEFT:
                    this.setHamCycleNumber(x*2+1, y*2+1, hamCycleIndex++);
                    if(nextDirection == direction || nextDirection == Moves.UP || nextDirection == Moves.RIGHT) {
                        this.setHamCycleNumber(x*2, y*2+1, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.UP || nextDirection == Moves.RIGHT) {
                        this.setHamCycleNumber(x*2, y*2, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.RIGHT) {
                        this.setHamCycleNumber(x*2+1, y*2, hamCycleIndex++);
                    }
                    break;
                case Moves.UP:
                    this.setHamCycleNumber(x*2, y*2+1, hamCycleIndex++);
                    if(nextDirection == direction || nextDirection == Moves.RIGHT || nextDirection == Moves.DOWN) {
                        this.setHamCycleNumber(x*2, y*2, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.RIGHT || nextDirection == Moves.DOWN) {
                        this.setHamCycleNumber(x*2+1, y*2, hamCycleIndex++);
                    }
                    if(nextDirection == Moves.DOWN) {
                        this.setHamCycleNumber(x*2+1, y*2+1, hamCycleIndex++);
                    }
                    break;
            }
            direction = nextDirection;


            switch(nextDirection) {
                case Moves.RIGHT: ++x; break;
                case Moves.LEFT: --x; break;
                case Moves.DOWN: ++y; break;
                case Moves.UP: --y; break;
            }
            console.log("gen coords: " + x + " " +y);
            console.log(hamCycleIndex);
            // POTENTIAL PROBLEMS HERE
        } while(hamCycleIndex < (this.game.board.width*this.game.board.height));
    }

    setHamCycleNumber(x, y, hamCycleIndex) {
        if(this.getHamCycleNumber(x,y) != 0) return;
        this.hamiltonianCycle[x+y*this.game.board.width] = hamCycleIndex;
    }

    getHamCycleNumber(x, y) {
        return this.hamiltonianCycle[x+y*this.game.board.width];
    }

    getDistanceOnCycle(pointOne, pointTwo) {
        if(pointOne < pointTwo) {
            return pointTwo-pointOne-1;
        }
        return pointTwo-pointOne-1+this.game.board.width*this.game.board.height;
    }

    checkForCollison(x, y) {
        if(x >= this.game.board.width || x < 0 || y >= this.game.board.height || y < 0) return true;
        let collision = false;
        this.game.you.body.forEach(item => {
            if(item.x == x && item.y == y) collision = true;
            console.log(item.x + " " + x + item.y + " " + y);
        });
        console.log(collision);
        return collision;
        
        // CHECK FOR ENEMY SNAKES
        //for (const enemy in this.game)
    }

    findNextDirection(x, y, direction) {
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

    writeMazeToFile() {
        fs.writeFileSync(this.game.game.id, "");
        for(let y = 0; y < Math.floor(this.game.board.height/2); ++y) {
            fs.appendFileSync(this.game.game.id, '#');
            for(let x = 0; x < Math.floor(this.game.board.width/2); ++x) {
                if(this.maze.canGoRight(x,y) && this.maze.canGoDown(x,y)) {
                    fs.appendFileSync(this.game.game.id, '+');
                } else if(this.maze.canGoRight(x,y)) {
                    fs.appendFileSync(this.game.game.id, '-');
                } else if(this.maze.canGoDown(x,y)) {
                    fs.appendFileSync(this.game.game.id, "|");
                } else {
                    fs.appendFileSync(this.game.game.id, " ");
                }
            }
            fs.appendFileSync(this.game.game.id, "\n");
        }
    }

    writeHamCycleToFile() {
        let fileName = "cycle " + this.game.game.id;
        fs.writeFileSync(fileName, "");
        for(let y = 0; y < this.game.board.height; y++) {
            for(let x = 0; x < this.game.board.width; x++) {
                let number = this.getHamCycleNumber(x,y);
                number = number.toString();
                while(number.length < 2) {
                    number = "0" + number;
                }
                fs.appendFileSync(fileName, number);
            }
            fs.appendFileSync(fileName, "\n");
        }
    }
}

// Make sure snake is alive (responding to requests).
app.post('/ping', (request, response) => {
    return response.status(200).json({});
});

// Start of a game. Return snake options.
app.post('/start', (request, response) => {
    gameData[request.body.game.id] = new HamCycle(request.body);
    return response.status(200).json(snake);
});

// Ask for move. Get 500 ms to repond with up,left,right,down.
app.post('/move', (request, response) => {

    // Check if there exists an enemy snake body with a number greater than the head.
    // If there is set a cutting distance of the highest enemy block plus 3 (buffer).
    // Follow cycle if there is no such block until there is such a block.
    // If no enemy snakes have a block greater than the head, try to find food.
    // 
    // Need to determine how many blocks to scan into the future.

    // Logic for getting food.

    // Need away to detemine if the snake is currently on food and 
    // subtract on extra square if it is.

    let currentHamCycle = gameData[request.body.game.id];
    let hamCycleIndex = currentHamCycle.getHamCycleNumber(request.body.you.body[0].x, request.body.you.body[0].y);
    let distanceToFood = currentHamCycle.getDistanceOnCycle(hamCycleIndex, currentHamCycle.getHamCycleNumber(request.body.board.food[0].x,request.body.board.food[0].y));
    let distanceToTail = currentHamCycle.getDistanceOnCycle(hamCycleIndex, currentHamCycle.getHamCycleNumber(request.body.you.body[request.body.you.body.length-1].x, request.body.you.body[request.body.you.body.length-1].x));
    let cuttingAmountAvailable = distanceToTail - request.body.you.body.length - 3;
    let emptySquaresOnBoard = request.body.board.height*request.body.board.width - request.body.you.body.length - request.body.board.food.length; 

    // Logic for progressivly lowering cutting amount needed. 

    let cuttingAmountDesired = distanceToFood;

    // Temp
    cuttingAmountAvailable = 0;

    // Get available moves.
    let canGoRight = !currentHamCycle.checkForCollison(request.body.you.body[0].x+1, request.body.you.body[0].y);
    let canGoLeft = !currentHamCycle.checkForCollison(request.body.you.body[0].x-1, request.body.you.body[0].y);
    let canGoDown = !currentHamCycle.checkForCollison(request.body.you.body[0].x, request.body.you.body[0].y+1);
    let canGoUp = !currentHamCycle.checkForCollison(request.body.you.body[0].x, request.body.you.body[0].y-1);

    console.log("All directions checked.");

    let bestDistance = -1;
    let bestDirection;
    if(canGoRight) {
        let distance = currentHamCycle.getDistanceOnCycle(hamCycleIndex, currentHamCycle.getHamCycleNumber(request.body.you.body[0].x+1, request.body.you.body[0].y));
        if (distance <= cuttingAmountAvailable || distance < bestDistance) {
            bestDirection = Moves.RIGHT;
            bestDistance = distance;
        }
    }
    if(canGoLeft) {
        let distance = currentHamCycle.getDistanceOnCycle(hamCycleIndex, currentHamCycle.getHamCycleNumber(request.body.you.body[0].x-1, request.body.you.body[0].y));
        if (distance <= cuttingAmountAvailable || distance < bestDistance) {
            bestDirection = Moves.LEFT;
            bestDistance = distance;
        }
    }
    if(canGoDown) {
        let distance = currentHamCycle.getDistanceOnCycle(hamCycleIndex, currentHamCycle.getHamCycleNumber(request.body.you.body[0].x, request.body.you.body[0].y+1));
        if (distance <= cuttingAmountAvailable || distance < bestDistance) {
            bestDirection = Moves.DOWN;
            bestDistance = distance;
        }
    }
    if(canGoUp) {
        let distance = currentHamCycle.getDistanceOnCycle(hamCycleIndex, currentHamCycle.getHamCycleNumber(request.body.you.body[0].x, request.body.you.body[0].y-1));
        if (distance <= cuttingAmountAvailable || distance < bestDistance) {
            bestDirection = Moves.UP;
            bestDistance = distance;
        }
    }

    if(!(bestDistance >= 0)) {
        if(canGoUp) bestDirection = Moves.UP;
        else if(canGoLeft) bestDirection = Moves.LEFT;
        else if(canGoRight) bestDirection = Moves.RIGHT;
        else if(canGoDown) bestDirection = Moves.DOWN;
        else bestDirection = Moves.DOWN;
    }

    return response.status(200).json({'move': bestDirection});
});

// Game has ended.
app.post('/end', (request, response) => {
    gameData[request.body.game.id].writeMazeToFile();
    gameData[request.body.game.id].writeHamCycleToFile();
    return response.status(200).json({});
});

// Listen on port.
app.listen(app.get('port'), () => {
    console.log(`Listening: ${app.get('port')}.`);
});
