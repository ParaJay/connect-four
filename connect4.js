window.onload = () => {
    let canvas = document.getElementById('my-canvas'); //load the canvas

    init(canvas); //load our init
}

var width, height, h6, w7, xOffset, yOffset;
var canvas;
var context;
var over = false;
const board = [[]];
var turn = 0;
var turns = 0; 
var winSpaces = [[], [], [], []]; //used to store x and y values of confirmed win spaces, used to display win
var rendering = false;
var won = false;
var dropWait = 40;
var selectedColumn = null;

function init(canvas) {
    this.canvas = canvas;
    canvas.onmousedown = onClick;
    canvas.onmousemove = onMove;
    canvas.keydown = onKey;
    context = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;

    context.lineWidth = 2;

    w7 = width / 7;
    h6 = height / 6;

    xOffset = (w7 / 2);
    yOffset = (h6 / 2);

    for(let i = 0; i < 7; i++) {
        board[i] = [null, null, null, null, null, null];
    }

    drawBoard();
}

function onKey(e) {

}

function onClick(e) {
    if(over || rendering) {
        return; //don't register if the game is over or is busy rendering piece drop
    }

    let x = e.pageX - canvas.offsetLeft; //get the clicked x position

    let xIndex = Math.floor(x / w7); //convert x to it's index in relation to the canvas (used for board array index)

    //if the topmost value in this column is present, return (there's no space to drop a token in)
    if(!isEmpty(xIndex, 0)) {
        return;
    }

    board[xIndex][0] = turn;

    turns++;

    render();

    turn = turn == 0 ? 1 : 0;

    document.title = "Connect 4: " + getTurn() + "'s Turn";
}

function onMove(e) {
    let x = Math.floor((e.pageX - canvas.offsetLeft) / w7);

    if(selectedColumn != x) {
        selectedColumn = x;
        render();
    }
}

function clear() {
    context.beginPath();
    context.fillStyle = "white";
    context.moveTo(0, 0);
    context.rect(0, 0, width, height);
    context.fill();
    context.stroke();
}

function render() {
    // clear();
    drawBoard();
    drawWin();
    drawPieces();
    drawSelectedColumn();
}

function drawBoard() {
    context.strokeStyle = "black";

    for(let i = 1; i < 7; i++) {
        let x = i * w7;
        let y = i * h6;
        
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
        
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
    }
}

/**
 * absolutely scuffed, generally you would update values before rendering
 * i got lazy and decided to update while rendering but it seems to work
 * 
 * async allows the usage of await
 */
async function drawPieces() {
    rendering = true;

    for(let i = 0; i < board.length; i++) {
        let yboard = board[i];

        for(let j = 0; j < yboard.length; j++) {
            let value = yboard[j];

            let x = (i * w7) + xOffset;
            let y = (j * h6) + yOffset;

            if(value == null) {
                continue;
            }

            drawPiece(i, j, value == 0 ? "red" : "yellow"); //draw at the first position

            if(j < yboard.length - 1) { //check we're not at the top
                if(isEmpty(i, j + 1)) { //check there is a space to move down to
                    await sleep(dropWait); //sleep for 100ms

                    yboard[j] = null; //replace last position with null
                    yboard[j + 1] = value; //set new position

                    //fill the token's last position so it gives the impression of movement
                    context.beginPath();
                    context.fillStyle = "white";
                    //console.log(i == selectedColumn);
                    context.rect(i * w7, j * h6, w7, h6);
                    context.fill();
                    context.stroke();
                    

                    drawPiece(i, j + 1, value == 0 ? "red" : "yellow"); //draw at the new position
                }
            }

            board[i] = yboard;
        }
    }

    var won = checkWin();

    if(won && !this.over) {
        end((turn == 0 ? "Yellow" : "Red") + " won!");
        render();
    } else {
        if(turns == 42) {
            end("It's a draw!");
        }
    }

    rendering = false;
}

function drawPiece(i, j, colour) {
    let x = (i * w7) + xOffset;
    let y = (j * h6) + yOffset;

    context.beginPath();
    context.fillStyle = colour;
    context.arc(x, y, 32, 0, Math.PI * 2);
    context.fill();
    context.stroke();
}

function drawWin() {
    if(winSpaces.length != 4) {
        return;
    }

    for(let i = 0; i < winSpaces.length; i++) {
        let val = winSpaces[i];

        if(val.length == 0) {
            break;
        }

        let x = val[0];
        let y = val[1];

        context.beginPath();
        context.fillStyle = "lime";
        context.rect(x * w7, y * h6, w7, h6);
        context.fill();
        context.stroke();
    }
}

function drawSelectedColumn() {
    if(over) {
        return;
    }

    if(selectedColumn != null) { //double check it's not null <_<
        let x = selectedColumn * w7;
        let x2 = x + w7;

        context.strokeStyle = "yellow";

        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.fill();
        context.stroke();

        context.beginPath();
        context.moveTo(x2, 0);
        context.lineTo(x2, height);
        context.stroke();

        context.strokeStyle = "black";

        selectedColumn = null;
    }
}

/**
 * checks if there is already a value at board[x][y]
 * @param {Number} x 
 * @param {Number} y 
 * @returns true if the value is null and false otherwise
 */
function isEmpty(x, y) {
    return board[x][y] == null;
}

/**
 * used to sleep the specified amount of time when paired with await (see: {@link drawPieces})
 * (times out after reaching ms amount of time, does nothing in particular)
 * @param {Number} ms 
 * @returns a promise...
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function end(text) {
    document.title = text;
    over = true;
}

function getTurn() {
    return turn == 0 ? "Red" : "Yellow";
}

function matchDiagonal(x, y) {
    if(y < 3) {
        return false;
    }

    let a = board[x][y];

    //right diagonal check
    if(x <= 3) {
        let won = true;

        for(let i = 1; i < 4; i++) {
            if(a !== board[x + i][y - i]) {
                winSpaces = [[], [], [], []];
                won = false;
                break;
            } else {
               winSpaces[i] = [x + i, y - i];
            }
        }

        if(won) {
            winSpaces[0] = [x, y];
            return true;
        }
    }

    //left diagonal check
    if(x >= 3) {
        let won = true;

        for(let i = 1; i < 4; i++) {
            if(a !== board[x - i][y - i]) {
                winSpaces = [[], [], [], []];
                won = false;
                break;
            } else {
               winSpaces[i] = [x - i, y - i];
            }
        }

        if(won) {
            winSpaces[0] = [x, y];
            return true;
        }
    }

    return false;
}

function matchVertical(x, y) {
    if(x < 3) {
        return false;
    }

    let a = board[x][y];

    winSpaces[0] = [x, y]

    for(let i = 1; i < 4; i++) {
        if(a !== board[x - i][y]) {
            winSpaces = [[], [], [], []];
            return false;
        } else {
            winSpaces[i] = [x-i, y];
        }
    }
    
    return true;
}

function matchHorizontal(x, y) {
    if(y < 3) {
        return false;
    }

    let a = board[x][y];

    winSpaces[0] = [x, y]

    for(let i = 1; i < 4; i++) {
        if(a !== board[x][y-i]) {
            winSpaces = [[], [], [], []];
            return false;
        } else {
            winSpaces[i] = [x, y-i];
        }
    }
    
    return true;
}

function checkWin() {
    if(turns < 7) {
        return false;
    }

    for(let x = 6; x >= 0; x--) {
        for(let y = 5; y >= 0; y--) {
            let val = board[x][y];

            if(val == null) {
                continue;
            }

            if(matchVertical(x, y)) {
                return true;
            }

            if(matchHorizontal(x, y)) {
                return true;
            }

            if(matchDiagonal(x, y)) {
                return true;
            }
        }
    }

    return false;
}