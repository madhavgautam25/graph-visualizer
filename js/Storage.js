class Storage {

    static key = "graphxplore-graph";

    static save(graph) {
        const data = {
            directed: graph.directed,
            weighted: graph.weighted,

            nodes: [...graph.nodes.values()].map(node => ({
                id: node.id,
                x: node.x,
                y: node.y
            })),

            edges: graph.edges.map(edge => ({
                from: edge.from.id,
                to: edge.to.id,
                weight: edge.weight
            }))
        };

        Storage.validate(data);
        localStorage.setItem(Storage.key, JSON.stringify(data));
    }


    static load() {
        const saved = localStorage.getItem(Storage.key);
        if (saved === null) {
            return null;
        }

        try {
            const data = JSON.parse(saved);
            Storage.validate(data);
            return data;
        } catch (error) {
            throw new Error("The saved graph is invalid or corrupted.", { cause: error });
        }
    }


    static clear() {
        localStorage.removeItem(Storage.key);
    }


    static hasSavedGraph() {
        return localStorage.getItem(Storage.key) !== null;
    }

    static validate(data) {
        if (
            !data ||
            typeof data !== "object" ||
            !Array.isArray(data.nodes) ||
            !Array.isArray(data.edges) ||
            typeof data.directed !== "boolean" ||
            typeof data.weighted !== "boolean"
        ) {
            throw new TypeError("Saved graph must contain direction, weighting, nodes, and edges.");
        }

        const nodeIds = new Set();
        for (const node of data.nodes) {
            if (
                !node ||
                !Number.isSafeInteger(node.id) ||
                node.id < 1 ||
                !Number.isFinite(node.x) ||
                !Number.isFinite(node.y) ||
                nodeIds.has(node.id)
            ) {
                throw new TypeError("Saved graph contains an invalid or duplicate node.");
            }

            nodeIds.add(node.id);
        }

        const edgeKeys = new Set();
        for (const edge of data.edges) {
            if (
                !edge ||
                !Number.isSafeInteger(edge.from) ||
                !Number.isSafeInteger(edge.to) ||
                edge.from === edge.to ||
                !nodeIds.has(edge.from) ||
                !nodeIds.has(edge.to) ||
                !Number.isFinite(edge.weight) ||
                edge.weight < 1 ||
                !Number.isInteger(edge.weight)
            ) {
                throw new TypeError("Saved graph contains an invalid edge.");
            }

            const endpoints = data.directed
                ? [edge.from, edge.to]
                : [Math.min(edge.from, edge.to), Math.max(edge.from, edge.to)];
            const key = endpoints.join(":");
            if (edgeKeys.has(key)) {
                throw new TypeError("Saved graph contains duplicate edges.");
            }
            edgeKeys.add(key);
        }
    }
}


export { Storage };