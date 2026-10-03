class AnimationController {

    constructor(graph, renderer) {

        this.graph = graph;
        this.renderer = renderer;

        this.speed = 700;

        this.isPaused = false;
        this.isRunning = false;

        this.currentSteps = [];
        this.currentIndex = 0;

        this.timer = null;

        this.resolvePause = null;

        this.runId = 0;
    }


    setSpeed(speed) {

        this.speed = Number(speed);
    }


    async start(steps) {

        this.stop();

        const currentRunId =
            ++this.runId;


        this.graph.resetStates();

        this.currentSteps = steps;
        this.currentIndex = 0;

        this.isRunning = true;
        this.isPaused = false;


        this.renderer.draw();


        while (
            this.currentIndex <
            this.currentSteps.length
        ) {

            if (
                currentRunId !==
                this.runId
            ) {

                return {
                    completed: false
                };
            }


            await this.waitIfPaused();


            if (
                !this.isRunning ||
                currentRunId !== this.runId
            ) {

                return {
                    completed: false
                };
            }


            const step =
                this.currentSteps[
                    this.currentIndex
                ];


            await this.executeStep(
                step,
                currentRunId
            );


            if (
                currentRunId !== this.runId
            ) {

                return {
                    completed: false
                };
            }


            this.currentIndex++;
        }


        this.isRunning = false;


        return {
            completed: true
        };
    }


    async executeStep(step, runId) {

        if (!step) {
            return;
        }


        switch (step.type) {

            case "discover":
                this.handleDiscover(step);
                break;


            case "visit":
                this.handleVisit(step);
                break;


            case "relax":
                this.handleRelax(step);
                break;


            case "path":
                await this.handlePath(
                    step,
                    runId
                );
                break;


            case "no-path":
                this.handleNoPath(step);
                break;
        }


        if (runId !== this.runId) {
            return;
        }


        this.renderer.draw();


        if (
            step.type !== "path" &&
            step.type !== "no-path"
        ) {

            await this.delay(
                this.speed,
                runId
            );
        }
    }


    handleDiscover(step) {

        const node =
            this.graph.getNode(
                step.nodeId
            );


        if (!node) {
            return;
        }


        node.state = "visiting";


        this.setActiveEdge(
            step.fromId,
            step.nodeId
        );
    }


    handleVisit(step) {

        const node =
            this.graph.getNode(
                step.nodeId
            );


        if (!node) {
            return;
        }


        node.state = "visited";


        if (step.distance !== undefined) {

            node.distance =
                step.distance;
        }


        if (step.fromId !== undefined) {

            this.setActiveEdge(
                step.fromId,
                step.nodeId
            );
        }
    }


    handleRelax(step) {

        const node =
            this.graph.getNode(
                step.nodeId
            );


        if (!node) {
            return;
        }


        node.state = "visiting";

        node.distance =
            step.distance;


        this.setActiveEdge(
            step.fromId,
            step.nodeId
        );
    }


    handleNoPath() {

        this.resetEdgeActivity();
    }


    async handlePath(step, runId) {

        if (
            !step.path ||
            step.path.length === 0
        ) {
            return;
        }


        this.resetEdgeActivity();


        for (
            let i = 0;
            i < step.path.length;
            i++
        ) {

            if (
                !this.isRunning ||
                runId !== this.runId
            ) {
                return;
            }


            await this.waitIfPaused();


            if (
                !this.isRunning ||
                runId !== this.runId
            ) {
                return;
            }


            const nodeId =
                step.path[i];


            const node =
                this.graph.getNode(nodeId);


            if (node) {
                node.state = "path";
            }


            if (i > 0) {

                this.setActiveEdge(
                    step.path[i - 1],
                    step.path[i]
                );
            }


            this.renderer.draw();


            if (
                i <
                step.path.length - 1
            ) {

                await this.delay(
                    this.speed,
                    runId
                );
            }
        }
    }


    setActiveEdge(fromId, toId) {

        this.resetEdgeActivity();


        for (const edge of this.graph.edges) {

            if (
                edge.from.id === fromId &&
                edge.to.id === toId
            ) {

                edge.active = true;

                return;
            }


            if (
                !this.graph.directed &&
                edge.from.id === toId &&
                edge.to.id === fromId
            ) {

                edge.active = true;

                return;
            }
        }
    }


    resetEdgeActivity() {

        for (const edge of this.graph.edges) {
            edge.active = false;
        }
    }


    pause() {

        if (
            !this.isRunning ||
            this.isPaused
        ) {
            return;
        }


        this.isPaused = true;
    }


    resume() {

        if (
            !this.isRunning ||
            !this.isPaused
        ) {
            return;
        }


        this.isPaused = false;


        if (this.resolvePause) {

            this.resolvePause();

            this.resolvePause = null;
        }
    }


    togglePause() {

        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }


    stop() {

        this.runId++;

        this.isRunning = false;
        this.isPaused = false;

        this.currentSteps = [];
        this.currentIndex = 0;


        if (this.timer !== null) {

            clearTimeout(this.timer);

            this.timer = null;
        }


        if (this.resolvePause) {

            this.resolvePause();

            this.resolvePause = null;
        }
    }


    reset() {

        this.stop();

        this.graph.resetStates();

        this.renderer.draw();
    }


    delay(milliseconds, runId) {

        return new Promise(resolve => {

            this.timer =
                setTimeout(() => {

                    this.timer = null;

                    if (
                        runId === this.runId
                    ) {
                        resolve();
                    } else {
                        resolve();
                    }

                }, milliseconds);
        });
    }


    waitIfPaused() {

        if (!this.isPaused) {
            return Promise.resolve();
        }


        return new Promise(resolve => {

            this.resolvePause = resolve;
        });
    }
}


export { AnimationController };