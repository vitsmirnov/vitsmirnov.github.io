/*
(c) Vitaly Smirnov
mrmaybelately@gmail.com
https://github.com/vitsmirnov
2025
*/


class SnakeElement {
    x = 0.0;
    y = 0.0;
    direction = 0; // 0-3 (up, right, down left)
    #skin = "^>v<";
    #type = "snake";
    color = "rgba(0, 255, 200, 1)";

    constructor(x, y, direction, skin, color) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.#skin = skin;
        this.color = color;
    }

    get skin() { return this.#skin[this.direction]; }
    get fullSkin() { return this.#skin; }
    get intX() { return Math.floor(this.x); }
    get intY() { return Math.floor(this.y); }
    get type() { return this.#type; }
}

class Snake {
    #field = null;
    #events = null;
    #body = null;
    #speed = 6.1; // cell/second
    #color = "rgba(0, 255, 255, 1)";
    #hasStuck = false;

    constructor(field, events, x = 0, y = 2, direction = 2, skin = "^>v<", speed = 6.1,
        length = 3, color = "rgba(0, 255, 255, 1)"
    ) {
        this.#field = field;
        this.#events = events;
        this.#body = [new SnakeElement(x, y, direction, skin, color)];
        for (let i = length-1; i > 0; i--) {
            this.grow();
        }
        this.#speed = speed;
        this.#color = color;
    }
    // reset(x, y, direction) {}

    update(deltaTime) {
        const distance = this.#speed * (deltaTime / 1000);
        const angle = ((this.head.direction+3) % 4) * 90 * Math.PI / 180;
        const x = this.head.x + distance * Math.cos(angle);
        const y = this.head.y + distance * Math.sin(angle);
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const cell = this.#field.cell(ix, iy);

        this.#hasStuck = !(
            this.#field.doesCellExist(ix, iy) && 
            (cell === this.head || !["wall", "snake"].includes(cell.type))
        );
        if (!this.#hasStuck) {
            switch (cell.type) {
            case "food":
                this.#field.cells[iy][ix] = unit(' ', "space");
                this.grow();
                this.#events.push("grow");
                break;
            case "finish":
                this.#events.push("finish");
                break;
            }

            if (ix !== this.head.intX || iy !== this.head.intY) {
                for (let i = this.#body.length-1; i >= 0; i--) {
                    this.#field.cells[this.#body[i].intY][this.#body[i].intX] = unit(' ', "space");
                }

                for (let i = this.#body.length-1; i > 0; i--) {
                    this.#body[i].x = this.#body[i-1].x;
                    this.#body[i].y = this.#body[i-1].y;
                    this.#body[i].direction = this.#body[i-1].direction;
                }

                for (let i = this.#body.length-1; i > 0; i--) {
                    this.#field.cells[this.#body[i].intY][this.#body[i].intX] = this.#body[i];
                }
            }
            this.head.x = x;
            this.head.y = y;
            this.#field.cells[iy][ix] = this.head;

            for (const elem of this.#body) {
                elem.color = this.#color;
            }
        } else {
            for (const elem of this.#body) {
                elem.color = "red";
            }
            this.#events.push("game over");
        }
    }
    grow() {
        const angle = ((this.head.direction+3) % 4) * 90 * Math.PI / 180;
        const x = this.head.x + 1 * Math.cos(angle);
        const y = this.head.y + 1 * Math.sin(angle);
        const ix = Math.floor(x), iy = Math.floor(y);

        if (this.#field.doesCellExist(ix, iy) && this.#field.cell(ix, iy).type === "space") {
            this.#body.splice(0, 0, new SnakeElement(x, y, this.direction, this.head.fullSkin, this.#color));
        }

        this.putOnField(true);
    }
    putOnField(force = true) { // TODO: unfinished!
        for (const elem of this.#body) {
            if (force) {
                this.#field.cells[elem.intY][elem.intX] = elem;
            }
        }
    }

    get direction() { return this.head.direction; }
    set direction(value) {
        // 180 degree turn isn't allowed
        if (this.length === 1 || (value+2) % 4 !== this.#body[1].direction) {
            this.head.direction = value;
        }
    }

    get x() { return this.head.x; }
    set x(value) { this.head.x = value; }
    get y() { return this.head.y; }
    set y(value) { this.head.y = value; }
    get head() { return this.#body[0]; }
    get body() { return this.#body; }
    get length() { return this.#body.length; }
    set length(value) { this.#body.length = value; }
    get speed() { return this.#speed; }
    set speed(value) { this.#speed = value; }
    get hasStuck() { return this.#hasStuck; }
}


class GameField {
    #cells = null;

    constructor(width, height) {
        this.setSize(width, height);
    }

    import(cells) {
        this.#cells = cells;
    }
    setSize(width, height) {
        this.#cells = new Array(height);
        for (let y = 0; y < height; y++) {
            this.#cells[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                this.#cells[y][x] = unit(' ', "space");
            }
        }
    }

    get width() {
        if (this.#cells.length === 0) {
            return 0;
        }
        return this.#cells[0].length;
    }
    get height() { return this.#cells.length; }
    get cells() { return this.#cells; }
    cell(x, y) {
        if (!this.doesCellExist(x, y)) {
            return null;
        }
        return this.#cells[y][x];
    }
    doesCellExist(x, y) { return (0 <= x && x < this.width) && (0 <= y && y < this.height); }
}

class Game {
    #canvas = null;
    #context = null;

    #fontHeight = 20;
    #fontWidth = 10; // ?
    #fontColor = "rgba(0, 255, 0, 1)";
    #fontName = "Lucida Console"; // "Courier New", "Consolas"
    #backgroundColor = "black";

    #field = null;
    #player = null;
    #events = new Array();
    #levels = new Array();
    #levelNumber = 1;
    #gameControls = null;
    #menuControls = null;
    #allControls = null;

    #isRunning = false;
    #animationId = null;
    #prevTime = 0;
    #prevFPSTime = 0;
    #frameCount = 0;
    #fps = 0;
    #showState = false;
    #score = 0;
    #immortalityMode = false;

    #music = null;
    // #sound = null;
    #soundSrcIncScore = "";
    #soundSrcGameOver = "";
    #soundSrcNextLevel = "";
    #playMusic = false;
    #playEffects = true;

    constructor() {
        // this.#music = new Audio("./stuff/music/8-bit/pixel-dreams-20240608-165735.mp3");
        this.#music = new Audio("./sound/music/pixel-dreams-20240608-165735.mp3");
        this.#music.volume = 0.1;
        this.#music.loop = true;

        // this.#music.addEventListener('ended', () => {
        //     if (this.#playMusic) {
        //         this.#music.paly();
        //     }
        // });

        // this.#sound = new Audio("./stuff/effects/zvonkiy-schelchok.mp3");
        this.#soundSrcIncScore = "./sound/effects/zvonkiy-schelchok.mp3";
        // this.#sound = new Audio("./sound/effects/zvonkiy-schelchok.mp3");
        // this.#sound.volume = 0.5;
        this.#soundSrcGameOver = "./sound/effects/zvuk-dlya-arkadnoy-igryi-konets-igryi-30123.mp3";
        this.#soundSrcNextLevel = "./sound/effects/otkryitie-novogo-predmeta-v-igre.mp3";

        this.#canvas = document.getElementById("canvas");
        this.#canvas.width = 1280;//1024;
        this.#canvas.height = 720;//768;
        // 1024*768
        // HD 1280×720 (16:9)
        // WXGA 1366×768 (16:9)
        // Full HD 1920×1080 (16:9)

        this.#context = this.#canvas.getContext("2d");
        this.#context.fillStyle = this.#backgroundColor; // strokeStyle
        this.#context.textAlign = "left";
        this.#context.textBaseline = "top";
        this.#context.lineWidth = 1;
        this.#context.font = `${this.#fontHeight}px ${this.#fontName}, monospace`;
        this.#fontWidth = this.#context.measureText(" ").width;

        this.#field = new GameField(0, 0);
        // this.#player = new Snake(this.#field, this.#events, startX, startY, 0, "^>v<", 6.2, 3);
        // this.#player.putOnField(true);

        // this.#levels = [
        //     levelData(8, 4, 9, 7, 10, 6.0), // 81
        //     levelData(10, 5, 7, 5, 15, 6.2), // 81
        //     levelData(13, 5, 5, 5, 18, 6.4), // 79
        //     levelData(16, 6, 4, 4, 21, 6.6), // 81
        //     levelData(20, 8, 3, 3, 25, 6.8) // 81
        // ];
        // (9+1)*8+1 = 81
        // (7+1)*10+1 = 81
        // (5+1)*13+1 = 79
        // (4+1)*16+1 = 81
        // (3+1)*20+1 = 81
        this.#levels = [
            levelData(10, 4, 9, 7, 15, 6.0),
            levelData(13, 5, 7, 5, 18, 6.2),
            levelData(17, 6, 5, 4, 22, 6.4),
            levelData(21, 6, 4, 4, 25, 6.6),
            levelData(26, 8, 3, 3, 35, 6.8)
        ];

        this.#generateLevel2(this.#levels[0]);

        this.#gameControls = {
            "KeyW": () => { this.#player.direction = 0; },
            "ArrowUp": () => { this.#player.direction = 0; },
            "KeyD": () => { this.#player.direction = 1; },
            "ArrowRight": () => { this.#player.direction = 1; },
            "KeyS": () => { this.#player.direction = 2; },
            "ArrowDown": () => { this.#player.direction = 2; },
            "KeyA": () => { this.#player.direction = 3; },
            "ArrowLeft": () => { this.#player.direction = 3; },

            // temp
            "KeyG": () => { this.#player.grow(); }, // "Enter"
            "KeyI": () => { this.#immortalityMode = !this.#immortalityMode; },
            "Equal": () => { this.#player.speed += 0.1; }, // "+"
            "Minus": () => { this.#player.speed -= 0.1; } // "-"
        };
        this.#menuControls = {};
        this.#allControls = {
            // "Space": () => { this.#playPause(); },
            "KeyP": () => { this.#playPause(); },
            "Backquote": () => { this.#showState = !this.#showState; }, // "`"
            "Space": () => {
                this.#isRunning = true;
                // this.#playMusic2();
            },

            // temp
            "Numpad1": () => { this.#nextLevel(); }, // "End"
            "Numpad7": () => { this.#newGame(); }, // "Home"

            "KeyM": () => { this.#playStopMusic(); },
            "KeyB": () => {
                if (document.body.style.backgroundColor === "black") {
                    document.body.style.backgroundColor = "white";
                } else {
                    document.body.style.backgroundColor = "black";
                }
            }
        };

        // this.#canvas.onclick = (event) => { this.#playPause(); }
        document.onkeydown = (event) => {
            console.log(event);

            if (this.#isRunning) {
                if (event.code in this.#gameControls) {
                    this.#gameControls[event.code]();
                }
            } else {
                if (event.code in this.#menuControls) {
                    this.#menuControls[event.code]();
                }
            }

            if (event.code in this.#allControls) {
                this.#allControls[event.code]();
            }
        }
    }
    // destroy() { // ?
    //     cancelAnimationFrame(this.#animationId);
    //     this.animationId = null;
    // }

    #playMusic2() {
        this.#playMusic = true;
        this.#music.play();
    }
    #playStopMusic() {
        this.#playMusic = !this.#playMusic;
        if (this.#playMusic) {
            this.#music.play();
        } else {
            this.#music.pause();
        }
    }
    #playPause() {
        // if (this.#isRunning) {
        //     cancelAnimationFrame(this.#animationId);
        // } else {
        //     this.#animationId = requestAnimationFrame(this.#loopTick.bind(this));
        // }
        this.#isRunning = !this.#isRunning;
        // this.#music.volume = 0.5;
        // this.#music.play();
    }

    #drawLogo() {
        const fontHeight = 15;//this.#fontHeight;
        this.#context.font = `${fontHeight}px Lucida Console, monospace`;
        const fontWidth = this.#context.measureText(' ').width;//this.#fontWidth;
        this.#context.fillStyle = "lime";
        for (let y = 0; y < logo.length; y++) {
            for (let x = 0; x < logo[y].length; x++ ) {
                this.#context.fillText(logo[y][x], x*fontWidth, y*fontHeight);
                // this.#context.fillText(logo[y][x], Math.floor(x*this.#fontWidth), y*this.#fontHeight);
            }
        }
    }
    #drawField() {
        // this.#context.save();
        // this.#context.fillStyle = this.#player.hasStuck ? "red" : this.#fontColor;
        const dy = Math.round((this.#canvas.height - (this.#field.height+3) * this.#fontHeight) / 2);
        const dx = Math.round((this.#canvas.width - this.#field.width * this.#fontWidth) / 2);
        for (let y = 0; y < this.#field.height; y++) {
            for (let x = 0; x < this.#field.width; x++) {
                this.#context.fillStyle = this.#field.cell(x, y).color;
                this.#context.fillText(
                    this.#field.cell(x, y).skin,
                    dx + x*this.#fontWidth,
                    dy + y*this.#fontHeight
                );
            }
        }
        // this.#context.restore();
    }
    #drawState(timestamp) {
        this.#context.fillStyle = this.#fontColor;// this.#player.hasStuck ? "red" : "lime";
        // this.#context.font = `30px Consolas, monospace`;
        // this.#context.textBaseline = "bottom";
        let stateAdd = "";
        if (this.#showState) {
            stateAdd = (
                // `map size: ${this.#map[0].length}*${this.#map.length}, `+
                // `snake len: ${this.#player.length}, `+
                " | "+
                `FPS: ${Math.round(this.#fps*10)/10} | `+
                `timestamp: ${Math.round(timestamp)} `+// ${performance.now()}`+
                `${this.#isRunning ? "|>" : "||"}`
            );
        }
        const text = (
            `Score: ${this.#score} | `+
            `Level: ${this.#levelNumber} | `+
            `Speed: ${Math.round(this.#player.speed*10) / 10}`+
            stateAdd
        );

        const x = Math.round((this.#canvas.width - this.#context.measureText(text).width) / 2);
        // const y = (this.#field.height+1) * this.#fontHeight; // this.#canvas.height;
        const y = Math.round((this.#canvas.height - (this.#field.height+3) * this.#fontHeight) / 2) +
            (this.#field.height+1) * this.#fontHeight;
        this.#context.fillText(text, x, y);
    }
    #updateScreen(timestamp) {
        this.#context.save();
        this.#context.fillStyle = this.#backgroundColor;
        this.#context.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
        // this.#drawLogo();
        this.#drawField();
        this.#drawState(timestamp);
        if (!this.#isRunning) {
            // draw || pause
        }
        this.#context.restore();
    }

    #loopTick(timestamp) { // #updateState
        // if (document.hidden) {
        //     this.#animationId = requestAnimationFrame(this.#loopTick.bind(this));
        //     return;
        // }

        if (timestamp - this.#prevTime > 1000) {
            this.#prevTime = timestamp;
            this.#prevFPSTime = timestamp;
            this.#frameCount = 0;
        }

        const deltaTime = timestamp - this.#prevTime;
        this.#prevTime = timestamp;

        const deltaFPSTime = timestamp - this.#prevFPSTime;
        if (deltaFPSTime >= 1000) {
            this.#fps = this.#frameCount / (deltaFPSTime / 1000);
            this.#prevFPSTime = timestamp;
            this.#frameCount = 0;
        }
        this.#frameCount++;

        if (this.#isRunning) {
            this.#player.update(deltaTime);
        }

        this.#processEvents();

        this.#updateScreen(timestamp);

        // this.#animationId = requestAnimationFrame(timestamp => { this.test(timestamp); });
        this.#animationId = requestAnimationFrame(this.#loopTick.bind(this));
    }
    #playEffect(src) {
        if (this.#playEffects) {
            const sound = new Audio(src);
            sound.volume = src !== this.#soundSrcGameOver ? 0.4 : 0.1;
            return sound.play();
        }
    }
    #processEvents() {
        for (const event of this.#events) {
        // while (this.#events.length !== 0) {
            // const event = this.#events.shift();
            console.log(event);
            switch (event) {
            case "grow":
                this.#playEffect(this.#soundSrcIncScore);
                this.#score++;
                break;
            case "finish":
                // alert("next level");
                // this.#playEffect(this.#soundSrcNextLevel);
                // this.#nextLevel();

                this.#isRunning = false;
                playSoundAndWait(this.#soundSrcNextLevel, 0.4)
                    .then(() => {
                        this.#nextLevel();
                    });
                break;
            case "game over":
                if (!this.#immortalityMode) {
                    // this.#isRunning = false;
                    // this.#playEffect(this.#soundSrcGameOver);
                    // alert(`Game over. Your score: ${this.#score}`);
                    // this.#newGame();

                    this.#isRunning = false;
                    playSoundAndWait(this.#soundSrcGameOver, 0.1)
                        .then(() => {
                            alert(`Game over. Your score: ${this.#score}`);
                            this.#newGame();
                        });

                    // this.#playEffect(this.#soundSrcGameOver)
                    //     .then((result) => {
                    //         alert(`Game over. Your score: ${this.#score}`);
                    //         this.#newGame();
                    //     });
                    // if (this.#playEffects) {
                    //     const sound = new Audio(this.#soundSrcGameOver);
                    //     sound.volume = 0.1;
                    //     sound.addEventListener("ended", () => {
                    //         alert(`Game over. Your score: ${this.#score}`);
                    //         this.#newGame();
                    //     });
                    //     sound.play();
                    // }
                }
                break;
            }
        }
        this.#events.length = 0;
    }

    #newGame() {
        this.#score = 0;
        this.#levelNumber = 0;
        this.#nextLevel();
    }
    #nextLevel() {
        // if (this.#playMusic) { // ?
        //     this.#music.play();
        // }
        this.#levelNumber++;
        if (this.#levelNumber-1 < this.#levels.length) {
            this.#isRunning = false;
            this.#generateLevel2(this.#levels[this.#levelNumber-1]);
            alert(
                `Level ${this.#levelNumber}. `+
                "Close this message and press Space to start. "+
                "Go to the red X. (mute music: M)"
            );
        } else {
            alert(`You won! Congratulations! Your score: ${this.#score}`);
            this.#newGame();
        }
    }

    #generateLevel2(levelData) {
        const {fieldWidth, fieldHeight, cellWidth, cellHeight, foodCount, speed} = levelData;
        this.#generateLevel(fieldWidth, fieldHeight, cellWidth, cellHeight, foodCount, speed);
    }
    #generateLevel(fieldWidth, fieldHeight, cellWidth, cellHeight, foodCount, speed) {
        this.#field.import(
            generateField(fieldWidth, fieldHeight, cellWidth, cellHeight, fieldWidth-1, fieldHeight-1));

        const startX = fieldWidth * (cellWidth+1) - 1 - Math.floor(cellWidth / 2);
        const startY = fieldHeight * (cellHeight+1) - 1;
        this.#player = new Snake( // TODO:
            this.#field, this.#events, startX, startY, 0, "^>v<", speed, 3, "rgba(0, 255, 255, 1)"
        );
        // this.#score = 0;

        this.#generateFood(foodCount);
    }
    #generateFood(count) {
        while (count !== 0) {
            const x = randRange(this.#field.width), y = randRange(this.#field.height);
            if (this.#field.cells[y][x].type === "space") {
                this.#field.cells[y][x] = unit('@', "food", "yellow");
                count--;
            }
        }
    }

    run() {
        // this.#isRunning = true;
        this.#animationId = requestAnimationFrame(this.#loopTick.bind(this));
        this.#newGame();
    }
}


function levelData(fieldWidth, fieldHeight, cellWidth, cellHeight, foodCount, speed) {
    return { fieldWidth, fieldHeight, cellWidth, cellHeight, foodCount, speed };
}

function unit(skin, type = "wall", color = "lime") {
    // types: "snake", "space", "wall", "food", "finish"
    // bodyType: "solid", "hollow"
    return { skin, color, type };
}

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function randRange(nextAfterMax) { return randInt(0, nextAfterMax-1); }

function point(x, y) {
    return {
        x, y,
        clone() { return point(this.x, this.y); },
        shiftedXY(dx, dy) { return point(this.x + dx, this.y + dy); },
        shifted(delta) { return this.shiftedXY(delta.x, delta.y); },
        isWithin(x0, x1, y0, y1) {
            return (x0 <= this.x && this.x <= x1) && (y0 <= this.y && this.y <= y1);
        }
    };
}

function generateMaze(width, height, startX = 0, startY = 0) {
    const mazeCell = (up = true, left = true, visited = false, distance = 0, isDeadEnd = false) => {
        return { up, left, visited, distance, isDeadEnd };
    }

    const maze = new Array(height);
    const cell = (pos) => { return maze[pos.y][pos.x]; }
    for (let y = 0; y < height; y++) {
        maze[y] = new Array(width);
        for (let x = 0; x < width; x++) {
            maze[y][x] = mazeCell();
        }
    }

    let curPos = point(startX, startY);
    cell(curPos).visited = true;
    const backPath = new Array();
    let distance = 0, maxDistance = 0;
    let farthestPos = curPos;
    while (true) {
        const nextPositions = new Array();
        for (const delta of [point(0, -1), point(1, 0), point(0, 1), point(-1, 0)]) {
            const nextPos = curPos.shifted(delta);
            if (nextPos.isWithin(0, width-1, 0, height-1) && !cell(nextPos).visited) {
                nextPositions.push(nextPos);
            }
        }

        if (nextPositions.length > 0) {
            let nextPos = nextPositions[randInt(0, nextPositions.length-1)];
            if (distance === 0) { // TODO: temp!
                nextPos = nextPositions[0];
            }
            if (nextPos.x === curPos.x) {
                if (nextPos.y > curPos.y) {
                    cell(nextPos).up = false
                } else {
                    cell(curPos).up = false;
                }
            } else {
                if (nextPos.x > curPos.x) {
                    cell(nextPos).left = false;
                } else {
                    cell(curPos).left = false;
                }
            }

            cell(nextPos).visited = true;
            cell(nextPos).distance = distance+1;
            backPath.push(curPos);
            curPos = nextPos;

            if (distance > maxDistance) {
                farthestPos = curPos;
                maxDistance = distance;
            }
            distance++;
        } else {
            if (backPath.length === 0) {
                break;
            }
            // cell(curPos).isDeadEnd = true;
            curPos = backPath.pop();
            distance--;
        }
    }

    return [maze, farthestPos];
}


function generateField(mazeWidth, mazeHeight, cellWidth, cellHeight, startX = 0, startY = 0) {
    const [maze, finish] = generateMaze(mazeWidth, mazeHeight, startX, startY);

    // const vert = '|', hor = '-', corner = '+';
    const wall = '#';

    const fieldWidth = mazeWidth*(cellWidth+1)+1, fieldHeight = mazeHeight*(cellHeight+1)+1;
    const field = new Array(fieldHeight);
    for (let y = 0; y < fieldHeight; y++) {
        field[y] = new Array(fieldWidth);
    }

    for (let y = 0; y < fieldHeight; y++) {
        const _y = Math.floor(y / (cellHeight+1));
        for (let x = 0; x < fieldWidth; x++) {
            const _x = Math.floor(x / (cellWidth+1));
            const isCorner = (x % (cellWidth+1) === 0 && y % (cellHeight+1) === 0); // ?
            if (isCorner ||
                (x === fieldWidth-1 || y === fieldHeight-1) ||
                (_x < mazeWidth && _y < mazeHeight &&
                ((x % (cellWidth+1) === 0 && maze[_y][_x].left) ||
                 (y % (cellHeight+1) === 0 && maze[_y][_x].up)))
            ) {
                field[y][x] = unit(wall, "wall", "lime");//"rgba(10, 210, 10, 1)");
                // field[y][x] = unit(' ', "space");
            } else {
                field[y][x] = unit(' ', "space");//null;
            }

            // if (isCorner && _x < mazeWidth && _y < mazeHeight) {
            //     field[y+0][x+0] = unit(`${maze[_y][_x].distance}`);
            // }
            // if (isCorner && _x < mazeWidth && _y < mazeHeight && maze[_y][_x].isDeadEnd) {
            //     field[y+0][x+0] = unit('*', "wall", "blue");
            // }

            if (_x === finish.x && _y === finish.y) {
                const __x = _x*(cellWidth+1) + Math.floor((cellWidth + 1) / 2);
                const __y = _y*(cellHeight+1) + Math.floor((cellHeight + 1) / 2);
                field[__y][__x] = unit('X', "finish", "red");
            }
        }
    }

    return field;
}

async function playSoundAndWait(src, volume) {
    const sound = new Audio(src);
    sound.volume = volume;
    try {
        await sound.play();
        await new Promise(resolve => {
            sound.addEventListener('ended', resolve, { once: true });
        });
    } catch (error) {
        
    }
}


function main() {
    const game = new Game();
    game.run(); 
}

document.addEventListener("DOMContentLoaded", main);



const logo = [
    "╔═════════════════════════════════════════════════════╗",
    "║  ███╗   ███╗ █████╗ ███████╗██╗███╗   ██╗ ██████╗   ║",
    "║  ████╗ ████║██╔══██╗╚══███╔╝██║████╗  ██║██╔════╝   ║",
    "║  ██╔████╔██║███████║  ███╔╝ ██║██╔██╗ ██║██║  ███╗  ║",
    "║  ██║╚██╔╝██║██╔══██║ ███╔╝  ██║██║╚██╗██║██║   ██║  ║",
    "║  ██║ ╚═╝ ██║██║  ██║███████╗██║██║ ╚████║╚██████╔╝  ║",
    "║  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝   ║",
    "║                                                     ║",
    "║     ███████╗███╗   ██╗ █████╗ ██╗  ██╗███████╗      ║",
    "║     ██╔════╝████╗  ██║██╔══██╗██║ ██╔╝██╔════╝      ║",
    "║     ███████╗██╔██╗ ██║███████║█████╔╝ █████╗        ║",
    "║     ╚════██║██║╚██╗██║██╔══██║██╔═██╗ ██╔══╝        ║",
    "║     ███████║██║ ╚████║██║  ██║██║  ██╗███████╗      ║",
    "║     ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝      ║",
    "╚═════════════════════════════════════════════════════╝"
];


// ╔═════════════════════════════════════════════════════╗
// ║  ███╗   ███╗ █████╗ ███████╗██╗███╗   ██╗ ██████╗   ║
// ║  ████╗ ████║██╔══██╗╚══███╔╝██║████╗  ██║██╔════╝   ║
// ║  ██╔████╔██║███████║  ███╔╝ ██║██╔██╗ ██║██║  ███╗  ║
// ║  ██║╚██╔╝██║██╔══██║ ███╔╝  ██║██║╚██╗██║██║   ██║  ║
// ║  ██║ ╚═╝ ██║██║  ██║███████╗██║██║ ╚████║╚██████╔╝  ║
// ║  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝   ║
// ║                                                     ║
// ║     ███████╗███╗   ██╗ █████╗ ██╗  ██╗███████╗      ║
// ║     ██╔════╝████╗  ██║██╔══██╗██║ ██╔╝██╔════╝      ║
// ║     ███████╗██╔██╗ ██║███████║█████╔╝ █████╗        ║
// ║     ╚════██║██║╚██╗██║██╔══██║██╔═██╗ ██╔══╝        ║
// ║     ███████║██║ ╚████║██║  ██║██║  ██╗███████╗      ║
// ║     ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝      ║
// ╚═════════════════════════════════════════════════════╝


// ███╗   ███╗ █████╗ ███████╗██╗███╗   ██╗ ██████╗     ███████╗███╗   ██╗ █████╗ ██╗  ██╗███████╗
// ████╗ ████║██╔══██╗╚══███╔╝██║████╗  ██║██╔════╝     ██╔════╝████╗  ██║██╔══██╗██║ ██╔╝██╔════╝
// ██╔████╔██║███████║  ███╔╝ ██║██╔██╗ ██║██║  ███╗    ███████╗██╔██╗ ██║███████║█████╔╝ █████╗  
// ██║╚██╔╝██║██╔══██║ ███╔╝  ██║██║╚██╗██║██║   ██║    ╚════██║██║╚██╗██║██╔══██║██╔═██╗ ██╔══╝  
// ██║ ╚═╝ ██║██║  ██║███████╗██║██║ ╚████║╚██████╔╝    ███████║██║ ╚████║██║  ██║██║  ██╗███████╗
// ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝


// ░░███╗░░  ░█████╗░  ███████╗  ██╗  ███╗░░██╗ ░██████╗  ███████╗  ███╗░░██╗ ░█████╗░ ██╗░░██╗ ███████╗
// ░████║░░  ██╔══██╗  ╚══███╔╝  ██║  ████╗░██║ ██╔════╝  ██╔════╝  ████╗░██║ ██╔══██╗ ██║░██╔╝ ██╔════╝
// ██╔██║░░  ███████║  ░░███╔╝░  ██║  ██╔██╗██║ ██║░░██╗  █████╗░░  ██╔██╗██║ ███████║ █████═╝░ █████╗░░
// ╚═╝██║░░  ██╔══██║  ░███╔╝░░  ██║  ██║╚████║ ██║░░╚██╗  ██╔══╝░░  ██║╚████║ ██╔══██║ ██╔═██╗░ ██╔══╝░░
// ███████╗  ██║░░██║  ███████╗  ██║  ██║░╚███║ ╚██████╔╝  ███████╗  ██║░╚███║ ██║░░██║ ██║░╚██╗ ███████╗
// ╚══════╝  ╚═╝░░╚═╝  ╚══════╝  ╚═╝  ╚═╝░░╚══╝ ░╚═════╝░  ╚══════╝  ╚═╝░░╚══╝ ╚═╝░░╚═╝ ╚═╝░░╚═╝ ╚══════╝
