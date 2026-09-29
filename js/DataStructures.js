/* Queue, Stack and Min Heap */


/* Queue */

class Queue {

    constructor() {
        this.items = {};
        this.front = 0;
        this.rear = 0;
    }


    enqueue(value) {
        this.items[this.rear] = value;
        this.rear++;
    }


    dequeue() {

        if (this.isEmpty()) {
            return undefined;
        }

        const value = this.items[this.front];

        delete this.items[this.front];

        this.front++;

        return value;
    }


    peek() {

        if (this.isEmpty()) {
            return undefined;
        }

        return this.items[this.front];
    }


    isEmpty() {
        return this.front === this.rear;
    }


    size() {
        return this.rear - this.front;
    }


    clear() {
        this.items = {};
        this.front = 0;
        this.rear = 0;
    }
}


/* Stack */

class Stack {

    constructor() {
        this.items = [];
    }


    push(value) {
        this.items.push(value);
    }


    pop() {
        return this.items.pop();
    }


    peek() {

        if (this.isEmpty()) {
            return undefined;
        }

        return this.items[this.items.length - 1];
    }


    isEmpty() {
        return this.items.length === 0;
    }


    size() {
        return this.items.length;
    }


    clear() {
        this.items = [];
    }
}


/* Min Heap */

class MinHeap {

    constructor() {
        this.heap = [];
    }


    insert(value) {

        this.heap.push(value);

        this.bubbleUp(
            this.heap.length - 1
        );
    }


    extractMin() {

        if (this.isEmpty()) {
            return undefined;
        }

        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        const min = this.heap[0];

        this.heap[0] =
            this.heap.pop();

        this.bubbleDown(0);

        return min;
    }


    peek() {

        if (this.isEmpty()) {
            return undefined;
        }

        return this.heap[0];
    }


    isEmpty() {
        return this.heap.length === 0;
    }


    size() {
        return this.heap.length;
    }


    bubbleUp(index) {

        while (index > 0) {

            const parentIndex =
                Math.floor((index - 1) / 2);


            if (
                this.heap[parentIndex].distance <=
                this.heap[index].distance
            ) {
                break;
            }


            this.swap(
                parentIndex,
                index
            );


            index = parentIndex;
        }
    }


    bubbleDown(index) {

        while (true) {

            const leftIndex =
                2 * index + 1;

            const rightIndex =
                2 * index + 2;

            let smallestIndex = index;


            if (
                leftIndex < this.heap.length &&
                this.heap[leftIndex].distance <
                this.heap[smallestIndex].distance
            ) {
                smallestIndex = leftIndex;
            }


            if (
                rightIndex < this.heap.length &&
                this.heap[rightIndex].distance <
                this.heap[smallestIndex].distance
            ) {
                smallestIndex = rightIndex;
            }


            if (smallestIndex === index) {
                break;
            }


            this.swap(
                index,
                smallestIndex
            );


            index = smallestIndex;
        }
    }


    swap(index1, index2) {

        const temp =
            this.heap[index1];

        this.heap[index1] =
            this.heap[index2];

        this.heap[index2] =
            temp;
    }


    clear() {
        this.heap = [];
    }
}


export {
    Queue,
    Stack,
    MinHeap
};