import { Edge } from "./Edge.js";

class Graph {

    constructor(directed = false, weighted = false) {
        this.directed = directed;
        this.weighted = weighted;

        // Stores nodeId -> Node
        this.nodes = new Map();

        // Stores nodeId -> list of neighbours
        this.adjacencyList = new Map();

        // Stores all edges for drawing on canvas
        this.edges = [];
    }


    addNode(node) {
        this.nodes.set(node.id, node);
        this.adjacencyList.set(node.id, []);
    }


    removeNode(nodeId) {

        if (!this.nodes.has(nodeId)) {
            return false;
        }

        // Remove all edges connected to this node
        this.edges = this.edges.filter(edge => {
            return edge.from.id !== nodeId &&
                   edge.to.id !== nodeId;
        });

        this.nodes.delete(nodeId);
        this.adjacencyList.delete(nodeId);

        // Remove this node from other adjacency lists
        for (const neighbours of this.adjacencyList.values()) {

            for (let i = neighbours.length - 1; i >= 0; i--) {

                if (neighbours[i].node.id === nodeId) {
                    neighbours.splice(i, 1);
                }
            }
        }

        return true;
    }


    hasEdge(fromId, toId) {

        const neighbours =
            this.adjacencyList.get(fromId);

        if (!neighbours) {
            return false;
        }

        return neighbours.some(item => {
            return item.node.id === toId;
        });
    }


    addEdge(fromId, toId, weight = 1) {

        if (fromId === toId) {
            return false;
        }

        if (
            !this.nodes.has(fromId) ||
            !this.nodes.has(toId)
        ) {
            return false;
        }

        if (this.hasEdge(fromId, toId)) {
            return false;
        }

        const fromNode =
            this.nodes.get(fromId);

        const toNode =
            this.nodes.get(toId);

        const edge =
            new Edge(
                fromNode,
                toNode,
                weight
            );

        this.edges.push(edge);

        this.adjacencyList
            .get(fromId)
            .push({
                node: toNode,
                weight: weight,
                edge: edge
            });


        // Add reverse connection for undirected graphs
        if (!this.directed) {

            this.adjacencyList
                .get(toId)
                .push({
                    node: fromNode,
                    weight: weight,
                    edge: edge
                });
        }

        return true;
    }


    removeEdge(fromId, toId) {

        const edgeIndex =
            this.edges.findIndex(edge => {

                if (
                    edge.from.id === fromId &&
                    edge.to.id === toId
                ) {
                    return true;
                }

                if (
                    !this.directed &&
                    edge.from.id === toId &&
                    edge.to.id === fromId
                ) {
                    return true;
                }

                return false;
            });


        if (edgeIndex === -1) {
            return false;
        }


        this.edges.splice(edgeIndex, 1);


        this.removeFromAdjacency(
            fromId,
            toId
        );


        if (!this.directed) {

            this.removeFromAdjacency(
                toId,
                fromId
            );
        }


        return true;
    }


    removeFromAdjacency(fromId, toId) {

        const neighbours =
            this.adjacencyList.get(fromId);

        if (!neighbours) {
            return;
        }

        const index =
            neighbours.findIndex(item => {
                return item.node.id === toId;
            });

        if (index !== -1) {
            neighbours.splice(index, 1);
        }
    }


    getNeighbours(nodeId) {

        return this.adjacencyList.get(nodeId) || [];
    }


    getNode(nodeId) {

        return this.nodes.get(nodeId);
    }


    getNodeCount() {

        return this.nodes.size;
    }


    getEdgeCount() {

        return this.edges.length;
    }


    resetStates() {

        for (const node of this.nodes.values()) {
            node.reset();
        }

        for (const edge of this.edges) {
            edge.reset();
        }
    }


    clear() {

        this.nodes.clear();
        this.adjacencyList.clear();
        this.edges = [];
    }
}

export { Graph };