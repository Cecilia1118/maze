const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const cellsHorizontal = 25;
const cellsVertical = 25;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);


// walls
const walls = [
    Bodies.rectangle(width / 2,0,width,2, {isStatic: true}),
    Bodies.rectangle(width / 2,height,width,2, {isStatic: true}),
    Bodies.rectangle(0,height / 2,2,height, {isStatic: true}),
    Bodies.rectangle(width,height / 2,2,height, {isStatic: true})
];
World.add(world, walls);

// maze generation
const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
}
const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));
const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal-1).fill(false));
const horizontals = Array(cellsVertical-1).fill(null).map(() => Array(cellsHorizontal).fill(false));
const startRow = Math.floor(Math.random() * cellsVertical);
const startCol = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, col) => {
    if (grid[row][col]) {
        return;
    }
    grid[row][col] = true;
    const neighbors = shuffle([
        [row-1,col,'up'],
        [row,col-1,'left'],
        [row+1,col,'down'],
        [row,col+1,'right']
    ]);
    for (let neighbor of neighbors) {
        const [nextRow, nextCol, direction] = neighbor;
        if (nextRow < 0 || nextRow >= cellsVertical || nextCol < 0 || nextCol >= cellsHorizontal) {
            continue;
        }
        if (grid[nextRow][nextCol]) {
            continue;
        }
        if (direction === 'left') {
            verticals[row][col-1] = true;
        } else if (direction === 'right') {
            verticals[row][col] = true;
        } else if (direction === 'up') {
            horizontals[row-1][col] = true;
        } else if (direction === 'down') {
            horizontals[row][col] = true;
        }
        stepThroughCell(nextRow, nextCol);
    }
};
stepThroughCell(1, 1);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, colIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            colIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            3, 
            {label: 'wall', isStatic: true, render: {fillStyle: 'red'}}
        );
        World.add(world, wall);
    });
});
verticals.forEach((col, colIndex) => {
    col.forEach((open, rowIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            rowIndex * unitLengthX + unitLengthX,
            colIndex * unitLengthY + unitLengthY / 2,
            3,
            unitLengthY, 
            {label: 'wall', isStatic: true, render: {fillStyle: 'red'}}
        );
        World.add(world, wall);
    });
});

// goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {label: 'goal', isStatic: true, render: {fillStyle: 'green'}}
);
World.add(world, goal);

// ball
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    Math.min(unitLengthX, unitLengthY) * 0.3, 
    {label: 'ball', render: {fillStyle: 'blue'}}
);
World.add(world, ball);

document.addEventListener('keydown', event => {
    const {x, y} = ball.velocity;
    if (event.keyCode == 38) {
        Body.setVelocity(ball, {x, y: y-5});
    }
    if (event.keyCode === 39) {
        Body.setVelocity(ball, {x: x+5, y});
    }
    if (event.keyCode === 40) {
        Body.setVelocity(ball, {x, y: y+5});
    }
    if (event.keyCode === 37) {
        Body.setVelocity(ball, {x: x-5, y});
    }
});

// win condition
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];
        if (labels.includes(collision.bodyA.label) && 
        labels.includes(collision.bodyB.label)) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            });
        }
    });
});