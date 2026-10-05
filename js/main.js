import { Graph } from "./Graph.js";
import { CanvasRenderer } from "./CanvasRenderer.js";
import { AnimationController } from "./AnimationController.js";
import { InteractionController } from "./InteractionController.js";
import { UIController } from "./UIController.js";

import {
    bfs,
    dfs,
    dijkstra
} from "./Algorithms.js";


/* Get canvas */

const canvas =
    document.getElementById(
        "graphCanvas"
    );


/* Create graph */

const graph =
    new Graph(
        false,
        false
    );


/* Create renderer */

const renderer =
    new CanvasRenderer(
        canvas,
        graph
    );


/* Create animation controller */

const animationController =
    new AnimationController(
        graph,
        renderer
    );


/* Create interaction controller */

const interactionController =
    new InteractionController(
        canvas,
        graph,
        renderer
    );


/*
 * Keep algorithms together so UIController
 * can select the required algorithm.
 */
const algorithms = {

    bfs: bfs,

    dfs: dfs,

    dijkstra: dijkstra
};


/* Create UI controller */

const uiController =
    new UIController(
        graph,
        renderer,
        animationController,
        interactionController,
        algorithms
    );


/* Handle window resizing */

window.addEventListener(
    "resize",
    () => {

        renderer.resize();
    }
);


/* Initial draw */

renderer.draw();