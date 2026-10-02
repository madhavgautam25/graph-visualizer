import { Queue, Stack, MinHeap } from "./DataStructures.js";


/* Breadth First Search */

function bfs(graph, startId, targetId = null) {

    const startNode = graph.getNode(startId);

    if (!startNode) {
        return [];
    }


    const queue = new Queue();
    const visited = new Set();
    const steps = [];


    queue.enqueue(startNode);
    visited.add(startNode.id);


    while (!queue.isEmpty()) {

        const current = queue.dequeue();


        steps.push({
            type: "visit",
            nodeId: current.id
        });


        if (
            targetId !== null &&
            current.id === targetId
        ) {
            break;
        }


        const neighbours =
            graph.getNeighbours(current.id);


        for (const item of neighbours) {

            const neighbour = item.node;


            if (visited.has(neighbour.id)) {
                continue;
            }


            visited.add(neighbour.id);

            neighbour.previous = current;


            steps.push({
                type: "discover",
                nodeId: neighbour.id,
                fromId: current.id
            });


            queue.enqueue(neighbour);
        }
    }


    addPathStep(
        graph,
        visited.has(targetId),
        targetId,
        steps
    );


    return steps;
}



/* Depth First Search */

function dfs(graph, startId, targetId = null) {

    const startNode = graph.getNode(startId);

    if (!startNode) {
        return [];
    }


    const stack = new Stack();

    const discovered = new Set();

    const visited = new Set();

    const steps = [];


    stack.push(startNode);
    discovered.add(startNode.id);


    while (!stack.isEmpty()) {

        const current = stack.pop();


        if (visited.has(current.id)) {
            continue;
        }


        visited.add(current.id);


        steps.push({
            type: "visit",
            nodeId: current.id
        });


        if (
            targetId !== null &&
            current.id === targetId
        ) {
            break;
        }


        const neighbours =
            graph.getNeighbours(current.id);


        for (
            let i = neighbours.length - 1;
            i >= 0;
            i--
        ) {

            const neighbour =
                neighbours[i].node;


            if (discovered.has(neighbour.id)) {
                continue;
            }


            discovered.add(neighbour.id);

            neighbour.previous = current;


            steps.push({
                type: "discover",
                nodeId: neighbour.id,
                fromId: current.id
            });


            stack.push(neighbour);
        }
    }


    addPathStep(
        graph,
        visited.has(targetId),
        targetId,
        steps
    );


    return steps;
}



/* Dijkstra's Algorithm */

function dijkstra(graph, startId, targetId = null) {

    const startNode =
        graph.getNode(startId);


    if (!startNode) {
        return [];
    }


    const distances = new Map();
    const visited = new Set();

    const steps = [];
    const heap = new MinHeap();


    for (const node of graph.nodes.values()) {

        distances.set(
            node.id,
            Infinity
        );

        node.distance = Infinity;
        node.previous = null;
    }


    distances.set(startId, 0);

    startNode.distance = 0;


    heap.insert({
        node: startNode,
        distance: 0
    });


    while (!heap.isEmpty()) {

        const currentItem =
            heap.extractMin();


        const current =
            currentItem.node;

        const currentDistance =
            currentItem.distance;


        if (
            currentDistance !==
            distances.get(current.id)
        ) {
            continue;
        }


        if (visited.has(current.id)) {
            continue;
        }


        visited.add(current.id);

        current.distance =
            currentDistance;


        steps.push({
            type: "visit",
            nodeId: current.id,
            distance: currentDistance
        });


        if (
            targetId !== null &&
            current.id === targetId
        ) {
            break;
        }


        const neighbours =
            graph.getNeighbours(current.id);


        for (const item of neighbours) {

            const neighbour =
                item.node;

            const weight =
                Number(item.weight);


            if (
                !Number.isFinite(weight) ||
                weight < 0
            ) {
                continue;
            }


            if (visited.has(neighbour.id)) {
                continue;
            }


            const newDistance =
                currentDistance + weight;


            const oldDistance =
                distances.get(neighbour.id);


            if (newDistance < oldDistance) {

                distances.set(
                    neighbour.id,
                    newDistance
                );


                neighbour.distance =
                    newDistance;

                neighbour.previous =
                    current;


                steps.push({
                    type: "relax",
                    nodeId: neighbour.id,
                    fromId: current.id,
                    distance: newDistance
                });


                heap.insert({
                    node: neighbour,
                    distance: newDistance
                });
            }
        }
    }


    addPathStep(
        graph,
        distances.get(targetId) !== Infinity,
        targetId,
        steps,
        distances.get(targetId)
    );


    return steps;
}



/* Add final path step */

function addPathStep(
    graph,
    hasPath,
    targetId,
    steps,
    distance = undefined
) {

    if (targetId === null) {
        return;
    }


    const targetNode =
        graph.getNode(targetId);


    if (!targetNode || !hasPath) {

        steps.push({
            type: "no-path",
            targetId: targetId
        });

        return;
    }


    const path = [];

    let current = targetNode;


    while (current) {

        path.push(current.id);

        current = current.previous;
    }


    path.reverse();


    const pathStep = {
        type: "path",
        path: path
    };


    if (distance !== undefined) {
        pathStep.distance = distance;
    }


    steps.push(pathStep);
}


export {
    bfs,
    dfs,
    dijkstra
};