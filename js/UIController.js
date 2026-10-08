import { Node } from "./Node.js";
import { createMathFunction } from "./MathGraphParser.js";
import { Storage } from "./Storage.js";

class UIController {
    constructor(graph, renderer, animationController, interactionController, algorithms) {
        this.graph = graph;
        this.renderer = renderer;
        this.animationController = animationController;
        this.interactionController = interactionController;
        this.algorithms = algorithms;
        this.history = [];
        this.pendingSnapshot = null;
        this.storageToastTimer = null;
        this.mode = new URLSearchParams(location.search).get("mode") === "math" ? "math" : "algorithm";
        this.cacheElements();
        this.setupSidebarResizer();
        this.connectControllers();
        this.setupEvents();
        this.setMode(this.mode);
        this.updateUI();
    }

    setupSidebarResizer() {
        const minimum = 250;
        const preferredMaximum = 480;
        const workspace = this.controlPanel.parentElement;
        let sidebarWidth = 300;

        const getMaximum = () => Math.max(
            minimum,
            Math.min(preferredMaximum, workspace.clientWidth - 328)
        );
        const setWidth = width => {
            sidebarWidth = Math.min(getMaximum(), Math.max(minimum, width));
            workspace.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
            this.sidebarResizer.setAttribute("aria-valuemax", String(getMaximum()));
            this.sidebarResizer.setAttribute("aria-valuenow", String(sidebarWidth));
            this.renderer.resize();
        };

        this.sidebarResizer.addEventListener("pointerdown", event => {
            if (event.button !== 0) return;
            event.preventDefault();
            this.sidebarResizer.setPointerCapture(event.pointerId);
            workspace.classList.add("resizing-sidebar");
            setWidth(event.clientX - workspace.getBoundingClientRect().left);
        });
        this.sidebarResizer.addEventListener("pointermove", event => {
            if (this.sidebarResizer.hasPointerCapture(event.pointerId)) {
                setWidth(event.clientX - workspace.getBoundingClientRect().left);
            }
        });
        const stopResize = event => {
            if (this.sidebarResizer.hasPointerCapture(event.pointerId)) {
                this.sidebarResizer.releasePointerCapture(event.pointerId);
            }
            workspace.classList.remove("resizing-sidebar");
        };
        this.sidebarResizer.addEventListener("pointerup", stopResize);
        this.sidebarResizer.addEventListener("pointercancel", stopResize);
        this.sidebarResizer.addEventListener("keydown", event => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                setWidth(sidebarWidth + (event.key === "ArrowRight" ? 16 : -16));
            } else if (event.key === "Home") {
                event.preventDefault();
                setWidth(minimum);
            } else if (event.key === "End") {
                event.preventDefault();
                setWidth(getMaximum());
            }
        });
        window.addEventListener("resize", () => {
            if (window.matchMedia("(min-width: 821px)").matches) {
                setWidth(sidebarWidth);
            }
        });
    }

    cacheElements() {

        const ids = [
            "controlPanel",
            "sidebarResizer",
            "algorithmMode",
            "mathMode",
            "algorithmControls",
            "mathControls",
            "algorithmSection",
            "edgeEditor",

            "graphType",
            "graphModeLabel",
            "weightedGraph",
            "edgeWeight",

            "selectedEdgeWeight",
            "selectedEdgeLabel",
            "saveEdgeWeight",
            "deleteSelection",

            "algorithm",
            "startNode",
            "targetNode",
            "targetGroup",
            "runAlgorithm",

            "speedSlider",
            "speedValue",
            "pauseResume",
            "resetVisualization",

            "clearGraph",
            "undoAction",

            "saveGraph",
            "loadGraph",
            "clearSavedGraph",
            "exportGraphJson",
            "importGraphJson",
            "importGraphFile",

            "storageToast",
            "statusMessage",
            "nodeCount",
            "edgeCount",
            "emptyMessage",
            "canvasTitle",

            "equationInput",
            "xMinInput",
            "xMaxInput",
            "yMinInput",
            "yMaxInput",
            "stepInput",
            "generateMathGraph",
            "createAlgorithmGraph"
        ];

        for (const id of ids) {

            this[
                id === "createAlgorithmGraph"
                    ? "createAlgorithmGraphButton"
                    : id
            ] = document.getElementById(id);
        }
    }

    connectControllers() {
        this.interactionController.onGetWeightedGraph = () => this.graph.weighted;
        this.interactionController.onGetEdgeWeight = () => this.getWeight(this.edgeWeight.value);
        this.interactionController.onGraphChange = action => { this.updateUI(); if (action) this.setStatus(this.actionMessage(action)); };
        this.interactionController.onHistoryStart = () => { this.pendingSnapshot = this.snapshot(); };
        this.interactionController.onHistoryCommit = () => this.commitHistory();
        this.interactionController.onSelectionChange = (edge, node) => this.showSelection(edge, node);
        this.interactionController.onMessage = message => this.setStatus(message);
    }

    setupEvents() {
        this.algorithmMode.addEventListener("click", () => this.setMode("algorithm"));
        this.mathMode.addEventListener("click", () => this.setMode("math"));
        this.graphType.addEventListener("change", () => { this.graph.directed = this.graphType.value === "directed"; this.rebuildAdjacency(); this.renderer.draw(); this.setStatus(`${this.graph.directed ? "Directed" : "Undirected"}.`); });
        this.weightedGraph.addEventListener("change", () => { this.graph.weighted = this.weightedGraph.value === "yes"; this.renderer.draw(); });
        this.algorithm.addEventListener("change", () => { if (this.algorithm.value === "dijkstra") { this.graph.weighted = true; this.weightedGraph.value = "yes"; } this.updateUI(); });
        this.runAlgorithm.addEventListener("click", () => this.runSelectedAlgorithm());
        this.speedSlider.addEventListener("input", () => { this.speedValue.textContent = `${this.speedSlider.value} ms`; this.animationController.setSpeed(this.speedSlider.value); });
        this.pauseResume.addEventListener("click", () => { this.animationController.togglePause(); this.pauseResume.textContent = this.animationController.isPaused ? "Resume" : "Pause"; });
        this.resetVisualization.addEventListener("click", () => { this.animationController.reset(); this.setStatus("Reset."); this.updateUI(); });
        this.clearGraph.addEventListener("click", () => this.clearGraphData());
        this.undoAction.addEventListener("click", () => this.undo());
        this.saveEdgeWeight.addEventListener("click", () => this.saveSelectedWeight());
        this.deleteSelection.addEventListener("click", () => this.interactionController.deleteSelection());
        this.generateMathGraph.addEventListener("click", () => this.generateMathPlot());
        this.createAlgorithmGraphButton.addEventListener("click", () => this.createAlgorithmGraph());
        this.saveGraph.addEventListener(
            "click",
            () => this.saveGraphToStorage()
        );
        this.loadGraph.addEventListener(
            "click",
            () => this.loadGraphFromStorage()
        );
        this.clearSavedGraph.addEventListener(
            "click",
            () => this.clearSavedGraphData()
        );
        this.exportGraphJson.addEventListener("click", () => this.exportGraphToJson());
        this.importGraphJson.addEventListener("click", () => this.importGraphFile.click());
        this.importGraphFile.addEventListener("change", event => this.importGraphFromFile(event));
    }

    setMode(mode) {
        this.mode = mode;
        const math = mode === "math";
        this.controlPanel.classList.toggle("math-mode", math);
        document.body.classList.toggle("math-mode", math);
        this.algorithmMode.classList.toggle("active", !math);
        this.mathMode.classList.toggle("active", math);
        this.algorithmControls.classList.toggle("hidden", math);
        this.algorithmSection.classList.toggle("hidden", math);
        this.mathControls.classList.toggle("hidden", !math);
        this.canvasTitle.textContent = math ? "Math graph" : "Algorithm graph";
        if (!math) this.renderer.draw();
        this.updateUI();
        this.setStatus(math ? "Enter an equation." : "Ready.");
    }

    snapshot() {
        return { directed: this.graph.directed, weighted: this.graph.weighted, nodes: [...this.graph.nodes.values()].map(node => ({ id: node.id, x: node.x, y: node.y })), edges: this.graph.edges.map(edge => ({ from: edge.from.id, to: edge.to.id, weight: edge.weight })) };
    }
    commitHistory() {
        if (!this.pendingSnapshot) return;
        const current = JSON.stringify(this.snapshot());
        if (current !== JSON.stringify(this.pendingSnapshot)) this.history.push(this.pendingSnapshot);
        this.pendingSnapshot = null;
        this.undoAction.disabled = this.history.length === 0;
    }


    restore(snapshot) {
        Storage.validate(snapshot);

        this.graph.clear();

        this.graph.directed =
            snapshot.directed;

        this.graph.weighted =
            snapshot.weighted;

        for (const item of snapshot.nodes) {

            if (!this.graph.addNode(new Node(item.id, item.x, item.y))) {
                throw new Error(`Could not restore node ${item.id}.`);
            }
        }

        for (const edge of snapshot.edges) {
            if (!this.graph.addEdge(edge.from, edge.to, edge.weight)) {
                throw new Error(`Could not restore edge ${edge.from} to ${edge.to}.`);
            }
        }

        this.graphType.value =
            this.graph.directed
                ? "directed"
                : "undirected";

        this.weightedGraph.value =
            this.graph.weighted
                ? "yes"
                : "no";

        this.interactionController.resetCounter();

        this.renderer.clearMathPlot();

        this.interactionController.selectedEdge = null;

        this.interactionController.selectedNode = null;

        this.showSelection(
            null,
            null
        );

        this.updateUI();

        this.renderer.draw();
    }

    undo() { const snapshot = this.history.pop(); if (!snapshot) return; this.restore(snapshot); this.setStatus("Undo complete."); this.undoAction.disabled = this.history.length === 0; }

    saveGraphToStorage() {
        try {
            Storage.save(this.graph);
            this.setStatus("Graph saved.");
            this.showStorageToast("Graph saved.");
        } catch (error) {
            console.error("Could not save graph:", error);
            this.setStatus("Could not save. Check browser storage.");
        }
    }

    exportGraphToJson() {
        try {
            const json = JSON.stringify(Storage.serialize(this.graph), null, 2);
            const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = "graphxplore-graph.json";
            document.body.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.setStatus("JSON exported.");
        } catch (error) {
            console.error("Could not export graph JSON:", error);
            this.setStatus("Could not export graph.");
        }
    }

    async importGraphFromFile(event) {
        const input = event.currentTarget;
        const [file] = input.files;
        if (!file) return;

        if (this.isRunning()) {
            this.setStatus("Wait for animation to finish.");
            input.value = "";
            return;
        }

        try {
            const data = JSON.parse(await file.text());
            Storage.validate(data);
            this.restore(data);
            this.history = [];
            this.pendingSnapshot = null;
            this.undoAction.disabled = true;
            this.setMode("algorithm");
            this.setStatus("JSON imported.");
        } catch (error) {
            this.setStatus("Invalid graph JSON.");
        } finally {
            input.value = "";
        }
    }

    loadGraphFromStorage() {
        if (this.isRunning()) {
            this.setStatus("Wait for animation to finish.");
            return;
        }

        try {
            const data = Storage.load();
            if (!data) {
                this.setStatus("No saved graph.");
                return;
            }

            this.restore(data);
            this.history = [];
            this.pendingSnapshot = null;
            this.undoAction.disabled = true;

            this.graphType.value =
                this.graph.directed
                    ? "directed"
                    : "undirected";

            this.weightedGraph.value =
                this.graph.weighted
                    ? "yes"
                    : "no";

            this.updateUI();
            this.setStatus("Graph loaded.");
        } catch (error) {
            this.setStatus(`Could not load the saved graph: ${error.message}`);
        }
    }

    clearSavedGraphData() {
        try {
            if (!Storage.hasSavedGraph()) {
                this.setStatus("No saved graph.");
                return;
            }
            Storage.clear();
            this.setStatus("Saved graph cleared.");
            this.showStorageToast("Saved graph cleared.");
        } catch (error) {
            console.error("Could not clear saved graph:", error);
            this.setStatus("Could not clear saved graph.");
        }
    }

    showSelection(edge, node) {
        for (const item of this.graph.edges) item.selected = item === edge;
        if (edge) { this.edgeEditor.classList.remove("hidden"); this.selectedEdgeLabel.textContent = `Node ${edge.from.id} ${this.graph.directed ? "→" : "—"} Node ${edge.to.id}`; this.selectedEdgeWeight.value = edge.weight; }
        else this.edgeEditor.classList.add("hidden");
        this.renderer.draw();
    }
    saveSelectedWeight() {
        const edge = this.interactionController.selectedEdge;
        const weight = this.getWeight(this.selectedEdgeWeight.value);
        if (!edge || weight < 1) { this.setStatus("Enter a positive edge weight."); return; }
        if (Number(edge.weight) !== weight) { this.pendingSnapshot = this.snapshot(); edge.weight = weight; this.rebuildAdjacency(); this.commitHistory(); this.renderer.draw(); this.setStatus("Edge weight updated."); }
    }

    clearGraphData() { if (this.isRunning()) return; if (this.graph.getNodeCount()) this.history.push(this.snapshot()); this.graph.clear(); this.renderer.clearMathPlot(); this.interactionController.resetCounter(); this.interactionController.selectedEdge = null; this.interactionController.selectedNode = null; this.showSelection(null, null); this.updateUI(); this.renderer.draw(); this.setStatus("Graph cleared."); this.undoAction.disabled = false; }
    getWeight(value) { const weight = Number(value); return Number.isFinite(weight) && weight >= 1 ? Math.round(weight) : 1; }
    rebuildAdjacency() { this.graph.adjacencyList.clear(); for (const node of this.graph.nodes.values()) this.graph.adjacencyList.set(node.id, []); for (const edge of this.graph.edges) { this.graph.adjacencyList.get(edge.from.id).push({ node: edge.to, weight: edge.weight, edge }); if (!this.graph.directed) this.graph.adjacencyList.get(edge.to.id).push({ node: edge.from, weight: edge.weight, edge }); } }
    actionMessage(action) { return ({ "node-created": "Node added.", "node-moved": "Node moved.", "edge-created": "Edge added.", "node-deleted": "Node deleted.", "edge-deleted": "Edge deleted." })[action] || "Graph updated."; }
    setStatus(message) { this.statusMessage.textContent = message; }
    showStorageToast(message, isError = false) {
        window.clearTimeout(this.storageToastTimer);
        this.storageToast.textContent = message;
        this.storageToast.classList.toggle("error", isError);
        this.storageToast.classList.remove("hidden");
        this.storageToastTimer = window.setTimeout(() => {
            this.storageToast.classList.add("hidden");
        }, 3000);
    }
    isRunning() { return this.animationController.isRunning; }

    updateUI() {
        const oldStart = this.startNode.value;
        const oldTarget = this.targetNode.value;
        this.startNode.replaceChildren(new Option("Select node", ""));
        this.targetNode.replaceChildren(new Option("Optional", ""));
        for (const node of this.graph.nodes.values()) { this.startNode.add(new Option(`Node ${node.id}`, node.id)); this.targetNode.add(new Option(`Node ${node.id}`, node.id)); }
        this.startNode.value = this.graph.getNode(Number(oldStart)) ? oldStart : "";
        this.targetNode.value = this.graph.getNode(Number(oldTarget)) ? oldTarget : "";
        this.nodeCount.textContent = this.graph.getNodeCount();
        this.edgeCount.textContent = this.graph.getEdgeCount();
        this.emptyMessage.classList.toggle("hidden", this.graph.getNodeCount() > 0 || this.mode === "math");
        this.runAlgorithm.disabled = this.graph.getNodeCount() === 0;
        this.resetVisualization.disabled = this.graph.getNodeCount() === 0;
        this.graphModeLabel.textContent = this.graph.directed ? "Directed" : "Undirected";
    }

    async runSelectedAlgorithm() {
        if (this.isRunning()) return;
        const startId = Number(this.startNode.value);
        const targetId = this.targetNode.value ? Number(this.targetNode.value) : null;
        if (!this.graph.getNode(startId)) { this.setStatus("Select a start node first."); return; }
        if (this.algorithm.value === "dijkstra" && this.graph.edges.some(edge => this.getWeight(edge.weight) < 0)) { this.setStatus("Dijkstra requires non-negative weights."); return; }
        this.graph.resetStates();
        const start = this.graph.getNode(startId); start.isStart = true;
        if (targetId !== null && this.graph.getNode(targetId)) this.graph.getNode(targetId).isTarget = true;
        const steps = this.algorithms[this.algorithm.value](this.graph, startId, targetId);
        if (!steps.length) { this.setStatus("No steps were generated."); return; }
        this.pauseResume.disabled = false;
        this.setStatus(`${this.algorithm.value.toUpperCase()} is running...`);
        const result = await this.animationController.start(steps);
        this.pauseResume.textContent = "Pause";
        if (result.completed) this.setStatus(`${this.algorithm.value.toUpperCase()} completed.`); else this.setStatus("Visualization stopped.");
        this.updateUI();
    }

    sampleEquation() {
        const xMin = Number(this.xMinInput.value), xMax = Number(this.xMaxInput.value), step = Number(this.stepInput.value);
        if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || !Number.isFinite(step) || xMax <= xMin || step <= 0) throw new Error("Use a valid X range and positive step");
        if (Math.floor((xMax - xMin) / step) + 1 > 700) throw new Error("Use a larger step or a narrower range");
        const evaluate = createMathFunction(this.equationInput.value), samples = [];
        for (let x = xMin; x <= xMax + step / 100; x += step) { const value = evaluate(Math.min(x, xMax)); samples.push({ x: Math.min(x, xMax), y: Number.isFinite(value) ? value : null }); if (x >= xMax) break; }
        const finite = samples.filter(item => item.y !== null);
        if (finite.length < 2) throw new Error("The equation has fewer than two finite points");
        const requestedMin = this.yMinInput.value.trim() === "" ? null : Number(this.yMinInput.value), requestedMax = this.yMaxInput.value.trim() === "" ? null : Number(this.yMaxInput.value);
        const low = Math.min(...finite.map(item => item.y)), high = Math.max(...finite.map(item => item.y)), padding = (high - low || 1) * .1;
        const yMin = requestedMin ?? low - padding, yMax = requestedMax ?? high + padding;
        if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax <= yMin) throw new Error("Use valid Y limits");
        return { samples, xMin, xMax, yMin, yMax, margin: 42 };
    }

    generateMathPlot() { try { const plot = this.sampleEquation(); this.renderer.setMathPlot(plot); this.renderer.draw(); this.setStatus(`Plotted ${this.equationInput.value.trim()}.`); } catch (error) { this.setStatus(`Invalid equation: ${error.message}.`); } }


    createAlgorithmGraph() {
        try {
            const plot = this.sampleEquation();
            const points = plot.samples.filter(item => item.y !== null && item.y >= plot.yMin && item.y <= plot.yMax);
            const width = Math.max(1, this.renderer.width - plot.margin * 2), height = Math.max(1, this.renderer.height - plot.margin * 2);
            const minimum = this.renderer.nodeRadius * 2.1, selected = [];
            for (const point of points) { const x = plot.margin + (point.x - plot.xMin) / (plot.xMax - plot.xMin) * width; const y = plot.margin + (plot.yMax - point.y) / (plot.yMax - plot.yMin) * height; if (selected.every(item => Math.hypot(item.x - x, item.y - y) >= minimum)) selected.push({ x, y, source: point }); }
            if (selected.length < 2) throw new Error("The selected range has fewer than two graph points");
            this.history.push(this.snapshot()); this.graph.clear(); this.graph.weighted = true; this.renderer.clearMathPlot(); this.interactionController.resetCounter();
            selected.forEach((point, index) => this.graph.addNode(new Node(index + 1, point.x, point.y)));
            for (let index = 1; index < selected.length; index++) { const a = selected[index - 1], b = selected[index]; if (Math.abs(a.source.y - b.source.y) < (plot.yMax - plot.yMin) * .75) this.graph.addEdge(index, index + 1, Math.max(1, Math.round(Math.hypot(a.x - b.x, a.y - b.y)))); }
            this.setMode("algorithm"); this.updateUI(); this.renderer.draw(); this.setStatus(`Created ${selected.length} algorithm nodes from the equation.`); this.undoAction.disabled = false;
        } catch (error) { this.setStatus(`Could not create graph: ${error.message}.`); }
    }
}

export { UIController };
