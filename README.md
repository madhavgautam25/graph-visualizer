# GraphXplore

## Project Proposal

### 1. Project Description

GraphXplore is an interactive Graph Algorithm Visualizer designed to help students understand graph data structures and algorithms through visual interaction. The application allows users to create and modify graphs, add weighted or directed edges, and observe the working of graph traversal and shortest-path algorithms through step-by-step animations.

The project also includes a Mathematical Graph mode that allows users to visualize mathematical equations on a coordinate plane and convert sampled mathematical points into an algorithm-ready graph.

### 2. Project Goals

The main goals of GraphXplore are:

- To provide an interactive environment for learning graph data structures.
- To visually demonstrate BFS, DFS and Dijkstra's Algorithm.
- To help users understand algorithm execution step by step.
- To support creation and modification of custom graphs.
- To demonstrate the use of custom Queue, Stack and Min-Heap data structures.
- To provide support for weighted and directed graphs.
- To connect mathematical graph visualization with discrete graph structures.
- To provide a simple and user-friendly interface suitable for learning and experimentation.

### 3. Project Specifications

#### Functional Requirements

- Create graph nodes interactively on the canvas.
- Move nodes using drag and drop.
- Create edges between nodes.
- Support directed and undirected graphs.
- Support weighted and unweighted edges.
- Add and edit custom edge weights.
- Undo graph modifications.
- Select start and target nodes.
- Run BFS, DFS and Dijkstra's Algorithm.
- Visualize algorithm execution step by step.
- Pause, resume and reset animations.
- Clear and rebuild graphs.
- Display mathematical functions using a coordinate system.
- Convert mathematical graph points into nodes and edges.
- Handle invalid mathematical expressions safely.

#### Technical Requirements

- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 Canvas
- ES Modules
- Custom Queue
- Custom Stack
- Custom Min-Heap
- No external frameworks or libraries

### 4. Project Design

GraphXplore follows a modular design where different responsibilities are separated into individual JavaScript modules.

```text
GraphXplore
│
├── User Interface
│   ├── Home Page
│   └── Visualizer Page
│
├── Graph Management
│   ├── Node
│   ├── Edge
│   └── Graph
│
├── Data Structures
│   ├── Queue
│   ├── Stack
│   └── Min-Heap
│
├── Algorithms
│   ├── BFS
│   ├── DFS
│   └── Dijkstra
│
├── Visualization
│   ├── Canvas Renderer
│   └── Animation Controller
│
├── Interaction
│   └── Graph Editing Controls
│
└── Mathematical Graph
    ├── Equation Parser
    ├── Coordinate System
    └── Graph Conversion