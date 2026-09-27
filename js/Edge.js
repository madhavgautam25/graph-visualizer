class Edge {

    constructor(from, to, weight = 1) {
        this.from = from;
        this.to = to;
        this.weight = weight;

        // Used to highlight an edge during animation
        this.active = false;
    }

    reset() {
        this.active = false;
    }
}

export { Edge };