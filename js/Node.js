class Node {

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;

        this.state = "unvisited";

        this.isStart = false;
        this.isTarget = false;

        this.previous = null;
        this.distance = Infinity;
    }


    reset() {

        this.state = "unvisited";

        this.isStart = false;
        this.isTarget = false;

        this.previous = null;
        this.distance = Infinity;
    }
}


export { Node };