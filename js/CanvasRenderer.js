class CanvasRenderer {

    constructor(canvas, graph) {

        this.canvas = canvas;
        this.graph = graph;

        this.ctx =
            canvas.getContext("2d");

        // Used for Retina / High-DPI screens
        this.devicePixelRatio =
            window.devicePixelRatio || 1;

        this.nodeRadius = 22;

        this.mathPlot = null;

        this.resize();
    }


    setMathPlot(plot) {

        this.mathPlot = plot;
    }


    clearMathPlot() {

        this.mathPlot = null;
    }


    /* Resize canvas for High-DPI displays */

    resize() {

        const rect =
            this.canvas.getBoundingClientRect();


        this.devicePixelRatio =
            window.devicePixelRatio || 1;


        this.canvas.width =
            rect.width * this.devicePixelRatio;

        this.canvas.height =
            rect.height * this.devicePixelRatio;


        this.ctx.setTransform(
            this.devicePixelRatio,
            0,
            0,
            this.devicePixelRatio,
            0,
            0
        );


        this.width = rect.width;
        this.height = rect.height;

        this.nodeRadius = this.getResponsiveNodeRadius();


        this.draw();
    }


    getResponsiveNodeRadius() {

        const smallestCanvasSide =
            Math.min(this.width, this.height);

        return Math.max(
            12,
            Math.min(22, smallestCanvasSide * 0.035)
        );
    }


    /* Draw complete graph */

    draw() {

        if (!this.width || !this.height) {
            return;
        }


        this.clearCanvas();

        this.drawMathGrid();
        this.drawMathCurve();
        this.drawEdges();
        this.drawNodes();
    }

    drawMathCurve() {
        if (!this.mathPlot || !this.mathPlot.samples) return;
        const plot = this.mathPlot;
        const left = plot.margin;
        const width = this.width - plot.margin * 2;
        const height = this.height - plot.margin * 2;
        let drawing = false;
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#237a5a";
        this.ctx.lineWidth = 2.5;
        for (const sample of plot.samples) {
            if (sample.y === null || sample.y < plot.yMin || sample.y > plot.yMax) {
                drawing = false;
                continue;
            }
            const x = left + ((sample.x - plot.xMin) / (plot.xMax - plot.xMin)) * width;
            const y = plot.margin + ((plot.yMax - sample.y) / (plot.yMax - plot.yMin)) * height;
            if (!drawing) { this.ctx.moveTo(x, y); drawing = true; } else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }


    drawMathGrid() {

        if (!this.mathPlot) {
            return;
        }

        const plot = this.mathPlot;
        const left = plot.margin;
        const right = this.width - plot.margin;
        const top = plot.margin;
        const bottom = this.height - plot.margin;
        const xToCanvas = value => {
            return left + ((value - plot.xMin) / (plot.xMax - plot.xMin)) * (right - left);
        };
        const yToCanvas = value => {
            return bottom - ((value - plot.yMin) / (plot.yMax - plot.yMin)) * (bottom - top);
        };
        const xTick = this.getTickStep(plot.xMax - plot.xMin);
        const yTick = this.getTickStep(plot.yMax - plot.yMin);

        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "#1e293b";

        for (let value = Math.ceil(plot.xMin / xTick) * xTick;
            value <= plot.xMax + xTick * 0.01;
            value += xTick) {
            const x = xToCanvas(value);

            this.drawGridLine(x, top, x, bottom);
            this.drawAxisLabel(this.formatAxisValue(value), x, bottom + 17, "center");
        }

        for (let value = Math.ceil(plot.yMin / yTick) * yTick;
            value <= plot.yMax + yTick * 0.01;
            value += yTick) {
            const y = yToCanvas(value);

            this.drawGridLine(left, y, right, y);
            this.drawAxisLabel(this.formatAxisValue(value), left - 8, y, "right");
        }

        this.ctx.strokeStyle = "#94a3b8";
        this.ctx.lineWidth = 1.5;

        if (plot.xMin <= 0 && plot.xMax >= 0) {
            const yAxisX = xToCanvas(0);
            this.drawGridLine(yAxisX, top, yAxisX, bottom);
            this.drawAxisArrow(yAxisX, top, 0, -1);
            this.drawAxisArrow(yAxisX, bottom, 0, 1);
            this.drawAxisLabel("+y", yAxisX + 8, top + 8, "left");
            this.drawAxisLabel("-y", yAxisX + 8, bottom - 8, "left");
        }

        if (plot.yMin <= 0 && plot.yMax >= 0) {
            const xAxisY = yToCanvas(0);
            this.drawGridLine(left, xAxisY, right, xAxisY);
            this.drawAxisLabel("x", right + 8, xAxisY, "left");
        }
    }


    drawAxisArrow(x, y, directionX, directionY) {

        const size = 7;
        const angle = Math.atan2(directionY, directionX);

        this.ctx.fillStyle = "#cbd5e1";
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - size * Math.cos(angle - Math.PI / 6),
            y - size * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x - size * Math.cos(angle + Math.PI / 6),
            y - size * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }


    drawGridLine(startX, startY, endX, endY) {

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }


    drawAxisLabel(text, x, y, align) {

        this.ctx.fillStyle = "#94a3b8";
        this.ctx.font = "10px Arial";
        this.ctx.textAlign = align;
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(text, x, y);
    }


    getTickStep(range) {

        const roughStep = range / 10;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalized = roughStep / magnitude;

        if (normalized <= 1) {
            return magnitude;
        }

        if (normalized <= 2) {
            return magnitude * 2;
        }

        if (normalized <= 5) {
            return magnitude * 5;
        }

        return magnitude * 10;
    }


    formatAxisValue(value) {

        if (Math.abs(value) < 0.000001) {
            return "0";
        }

        return Number(value.toFixed(4)).toString();
    }


    /* Clear canvas */

    clearCanvas() {

        this.ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );
    }


    /* Draw all edges */

    drawEdges() {

        for (const edge of this.graph.edges) {

            this.drawEdge(edge);
        }
    }


    /* Draw one edge */

    drawEdge(edge) {

        const from =
            edge.from;

        const to =
            edge.to;


        const dx =
            to.x - from.x;

        const dy =
            to.y - from.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance === 0) {
            return;
        }


        const unitX =
            dx / distance;

        const unitY =
            dy / distance;


        // Keep line outside the node circles
        const startX =
            from.x +
            unitX * this.nodeRadius;

        const startY =
            from.y +
            unitY * this.nodeRadius;


        const endX =
            to.x -
            unitX * this.nodeRadius;

        const endY =
            to.y -
            unitY * this.nodeRadius;


        this.ctx.beginPath();

        this.ctx.moveTo(
            startX,
            startY
        );

        this.ctx.lineTo(
            endX,
            endY
        );


        this.ctx.lineWidth =
            edge.active ? 4 : 2;


        this.ctx.strokeStyle = edge.selected
            ? "#d77845"
            : edge.active
                ? "#c86683"
                : "#718079";


        this.ctx.stroke();


        // Draw arrow for directed graphs
        if (this.graph.directed) {

            this.drawArrow(
                endX,
                endY,
                unitX,
                unitY,
                edge.active
            );
        }


        // Draw edge weight
        if (this.graph.weighted) {

            this.drawWeight(
                edge,
                from,
                to
            );
        }
    }


    /* Draw arrow head */

    drawArrow(
        x,
        y,
        directionX,
        directionY,
        active
    ) {

        const arrowSize = 9;

        const angle =
            Math.atan2(
                directionY,
                directionX
            );


        this.ctx.beginPath();

        this.ctx.moveTo(
            x,
            y
        );


        this.ctx.lineTo(
            x -
            arrowSize *
            Math.cos(angle - Math.PI / 6),

            y -
            arrowSize *
            Math.sin(angle - Math.PI / 6)
        );


        this.ctx.lineTo(
            x -
            arrowSize *
            Math.cos(angle + Math.PI / 6),

            y -
            arrowSize *
            Math.sin(angle + Math.PI / 6)
        );


        this.ctx.closePath();


        this.ctx.fillStyle =
            active
                ? "#ec4899"
                : "#64748b";


        this.ctx.fill();
    }


    /* Draw weight in the middle of an edge */

    drawWeight(edge, from, to) {

        const midX =
            (from.x + to.x) / 2;

        const midY =
            (from.y + to.y) / 2;


        const text =
            String(edge.weight);


        // Small background behind weight
        const padding = 5;

        const textWidth =
            this.ctx.measureText(text).width;


        this.ctx.fillStyle =
            "#0f172a";


        this.ctx.fillRect(
            midX - textWidth / 2 - padding,
            midY - 8,
            textWidth + padding * 2,
            16
        );


        this.ctx.fillStyle =
            "#f8fafc";


        this.ctx.font =
            "12px Arial";

        this.ctx.textAlign =
            "center";

        this.ctx.textBaseline =
            "middle";


        this.ctx.fillText(
            text,
            midX,
            midY
        );
    }


    /* Draw all nodes */

    drawNodes() {

        for (const node of this.graph.nodes.values()) {

            this.drawNode(node);
        }
    }


    /* Draw one node */

    drawNode(node) {

    let fillColor = "#475569";
    let borderColor = "#94a3b8";


    if (node.state === "visiting") {

        fillColor = "#f59e0b";
        borderColor = "#fbbf24";

    } else if (node.state === "visited") {

        fillColor = "#22c55e";
        borderColor = "#4ade80";

    } else if (node.state === "path") {

        fillColor = "#ec4899";
        borderColor = "#f472b6";
    }


    // Start and target keep their own identity
    if (node.isStart) {

        borderColor = "#818cf8";

    }

    if (node.isTarget) {

        borderColor = "#f87171";
    }


    this.ctx.beginPath();

    this.ctx.arc(
        node.x,
        node.y,
        this.nodeRadius,
        0,
        Math.PI * 2
    );


    this.ctx.fillStyle = fillColor;
    this.ctx.fill();


    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = borderColor;

    this.ctx.stroke();


    this.ctx.fillStyle = "#ffffff";

    this.ctx.font =
        "bold 13px Arial";

    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";


    this.ctx.fillText(
        node.id,
        node.x,
        node.y
    );


    this.drawDistanceLabel(node);
}

    drawDistanceLabel(node) {

        if (
            node.distance === undefined ||
            node.distance === Infinity
        ) {
            return;
        }

        const text =
            `d=${node.distance}`;

        const paddingX = 6;
        const labelHeight = 18;
        const labelY =
            node.y + this.nodeRadius + 7 <= this.height - labelHeight
                ? node.y + this.nodeRadius + 7
                : node.y - this.nodeRadius - labelHeight - 7;

        this.ctx.font =
            "bold 11px Arial";

        const textWidth =
            this.ctx.measureText(text).width;

        const labelWidth =
            textWidth + paddingX * 2;

        this.ctx.fillStyle =
            "#020617";

        this.ctx.fillRect(
            node.x - labelWidth / 2,
            labelY,
            labelWidth,
            labelHeight
        );

        this.ctx.strokeStyle =
            "#e2e8f0";

        this.ctx.lineWidth = 1;

        this.ctx.strokeRect(
            node.x - labelWidth / 2,
            labelY,
            labelWidth,
            labelHeight
        );

        this.ctx.fillStyle =
            "#f8fafc";

        this.ctx.textAlign =
            "center";

        this.ctx.textBaseline =
            "middle";

        this.ctx.fillText(
            text,
            node.x,
            labelY + labelHeight / 2
        );
    }

    /* Check whether a point is inside a node */

    getNodeAt(x, y) {

        for (const node of this.graph.nodes.values()) {

            const dx =
                x - node.x;

            const dy =
                y - node.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <=
                this.nodeRadius
            ) {
                return node;
            }
        }


        return null;
    }

    getEdgeAt(x, y) {
        let closest = null;
        let distance = 10;
        for (const edge of this.graph.edges) {
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            const lengthSquared = dx * dx + dy * dy;
            if (!lengthSquared) continue;
            const ratio = Math.max(0, Math.min(1, ((x - edge.from.x) * dx + (y - edge.from.y) * dy) / lengthSquared));
            const nearX = edge.from.x + ratio * dx;
            const nearY = edge.from.y + ratio * dy;
            const candidateDistance = Math.hypot(x - nearX, y - nearY);
            if (candidateDistance < distance) { distance = candidateDistance; closest = edge; }
        }
        return closest;
    }


    /* Check whether point is inside canvas */

    isInsideCanvas(x, y) {

        return (
            x >= 0 &&
            x <= this.width &&
            y >= 0 &&
            y <= this.height
        );
    }
}


export { CanvasRenderer };