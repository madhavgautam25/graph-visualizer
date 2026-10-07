import { Node } from "./Node.js";

class InteractionController {

    constructor(canvas, graph, renderer) {

        this.canvas = canvas;
        this.graph = graph;
        this.renderer = renderer;

        this.nodeCounter = 1;

        this.draggedNode = null;
        this.edgeStartNode = null;

        this.selectedNode = null;
        this.selectedEdge = null;

        this.setupEvents();
    }


    setupEvents() {

        this.canvas.addEventListener(
            "mousedown",
            event => this.handleMouseDown(event)
        );

        this.canvas.addEventListener(
            "mousemove",
            event => this.handleMouseMove(event)
        );

        this.canvas.addEventListener(
            "mouseup",
            event => this.handleMouseUp(event)
        );

        this.canvas.addEventListener(
            "mouseleave",
            () => this.handleMouseLeave()
        );

        this.canvas.addEventListener(
            "contextmenu",
            event => event.preventDefault()
        );


        document.addEventListener(
            "keydown",
            event => {

                const tag =
                    document.activeElement?.tagName;

                if (
                    (event.key === "Delete" ||
                     event.key === "Backspace") &&
                    !["INPUT", "SELECT", "TEXTAREA"]
                        .includes(tag)
                ) {

                    this.deleteSelection();
                }
            }
        );
    }


    getMousePosition(event) {

        const rect =
            this.canvas.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }


    handleMouseDown(event) {

        const position =
            this.getMousePosition(event);

        const node =
            this.renderer.getNodeAt(
                position.x,
                position.y
            );

        const edge =
            node
                ? null
                : this.renderer.getEdgeAt(
                    position.x,
                    position.y
                );


        /*
         * Shift + drag starts edge creation.
         */

        if (event.shiftKey && node) {

            this.edgeStartNode = node;

            this.renderer.draw();

            return;
        }


        /*
         * Node selected.
         */

        if (node) {

            this.selectedNode = node;
            this.selectedEdge = null;

            this.draggedNode = node;

            this.dragOffsetX =
                position.x - node.x;

            this.dragOffsetY =
                position.y - node.y;

            this.onSelectionChange?.(
                null,
                node
            );

            this.onHistoryStart?.();

            return;
        }


        /*
         * Edge selected.
         */

        if (edge) {

            this.selectedEdge = edge;
            this.selectedNode = null;

            this.onSelectionChange?.(
                edge,
                null
            );

            this.renderer.draw();

            return;
        }


        /*
         * Empty canvas:
         * create new node.
         */

        this.selectedNode = null;
        this.selectedEdge = null;

        this.onSelectionChange?.(
            null,
            null
        );

        this.addNode(
            position.x,
            position.y
        );
    }


    handleMouseMove(event) {

        const position =
            this.getMousePosition(event);


        if (this.draggedNode) {

            this.moveNode(
                position.x,
                position.y
            );

            this.renderer.draw();

        } else if (this.edgeStartNode) {

            this.renderer.draw();

            this.drawTemporaryEdge(
                this.edgeStartNode,
                position.x,
                position.y
            );
        }
    }


    handleMouseUp(event) {

        const position =
            this.getMousePosition(event);


        if (this.edgeStartNode) {

            const target =
                this.renderer.getNodeAt(
                    position.x,
                    position.y
                );

            if (
                target &&
                target !== this.edgeStartNode
            ) {

                this.createEdge(
                    this.edgeStartNode,
                    target
                );
            }

            this.edgeStartNode = null;
        }


        if (this.draggedNode) {

            this.onHistoryCommit?.();

            this.onGraphChange?.(
                "node-moved"
            );
        }


        this.draggedNode = null;

        this.renderer.draw();
    }


    handleMouseLeave() {

        if (this.edgeStartNode) {

            this.edgeStartNode = null;

            this.renderer.draw();
        }
    }


    addNode(x, y) {

        const radius =
            this.renderer.nodeRadius;


        x = Math.max(
            radius,
            Math.min(
                this.renderer.width - radius,
                x
            )
        );


        y = Math.max(
            radius,
            Math.min(
                this.renderer.height - radius,
                y
            )
        );


        if (this.isNodeTooClose(x, y)) {

            this.onMessage?.(
                "Node is too close to another node."
            );

            return;
        }


        this.onHistoryStart?.();


        const node =
            new Node(
                this.getNextNodeId(),
                x,
                y
            );


        this.graph.addNode(node);

        this.renderer.clearMathPlot();

        this.onGraphChange?.(
            "node-created"
        );
    }


    isNodeTooClose(x, y) {

        const minimumDistance =
            this.renderer.nodeRadius * 2 + 10;


        return [
            ...this.graph.nodes.values()
        ].some(node =>
            Math.hypot(
                x - node.x,
                y - node.y
            ) < minimumDistance
        );
    }


    getNextNodeId() {

        while (
            this.graph.getNode(
                this.nodeCounter
            )
        ) {

            this.nodeCounter++;
        }

        return this.nodeCounter++;
    }


    moveNode(x, y) {

        if (!this.draggedNode) {
            return;
        }


        const radius =
            this.renderer.nodeRadius;


        this.draggedNode.x =
            Math.max(
                radius,
                Math.min(
                    this.renderer.width - radius,
                    x - this.dragOffsetX
                )
            );


        this.draggedNode.y =
            Math.max(
                radius,
                Math.min(
                    this.renderer.height - radius,
                    y - this.dragOffsetY
                )
            );
    }


    createEdge(fromNode, toNode) {

        const weight =
            this.getWeightedGraph()
                ? this.getEdgeWeight()
                : 1;


        this.onHistoryStart?.();


        if (
            this.graph.addEdge(
                fromNode.id,
                toNode.id,
                weight
            )
        ) {

            this.onGraphChange?.(
                "edge-created"
            );

        } else {

            this.pendingSnapshot = null;

            this.onMessage?.(
                "Edge could not be created."
            );
        }
    }


    deleteSelection() {

        if (this.selectedNode) {

            this.onHistoryStart?.();


            const deleted =
                this.graph.removeNode(
                    this.selectedNode.id
                );


            if (deleted) {

                this.selectedNode = null;

                this.onSelectionChange?.(
                    null,
                    null
                );

                this.onGraphChange?.(
                    "node-deleted"
                );
            }


        } else if (this.selectedEdge) {

            this.onHistoryStart?.();


            const deleted =
                this.graph.removeEdge(
                    this.selectedEdge.from.id,
                    this.selectedEdge.to.id
                );


            if (deleted) {

                this.selectedEdge = null;

                this.onSelectionChange?.(
                    null,
                    null
                );

                this.onGraphChange?.(
                    "edge-deleted"
                );
            }
        }
    }


    drawTemporaryEdge(
        node,
        targetX,
        targetY
    ) {

        const distance =
            Math.hypot(
                targetX - node.x,
                targetY - node.y
            );


        if (!distance) {
            return;
        }


        const unitX =
            (targetX - node.x) /
            distance;

        const unitY =
            (targetY - node.y) /
            distance;


        const ctx =
            this.renderer.ctx;


        ctx.beginPath();

        ctx.moveTo(
            node.x +
            unitX *
            this.renderer.nodeRadius,

            node.y +
            unitY *
            this.renderer.nodeRadius
        );

        ctx.lineTo(
            targetX,
            targetY
        );


        ctx.setLineDash([
            6,
            6
        ]);

        ctx.strokeStyle =
            "#718079";

        ctx.stroke();

        ctx.setLineDash([]);
    }


    getWeightedGraph() {

        return (
            this.onGetWeightedGraph?.() ??
            this.graph.weighted
        );
    }


    getEdgeWeight() {

        return (
            this.onGetEdgeWeight?.() ??
            1
        );
    }


    resetCounter() {
        let highestId = 0;
        for (const id of this.graph.nodes.keys()) {
            if (Number.isSafeInteger(id) && id > highestId) {
                highestId = id;
            }
        }
        this.nodeCounter = highestId + 1;
    }
}


export { InteractionController };