class MathExpressionParser {

    constructor(expression) {
        this.tokens = this.tokenize(expression);
        this.position = 0;
    }

    tokenize(expression) {
        const tokens = [];
        let index = 0;

        while (index < expression.length) {
            const character = expression[index];

            if (/\s/.test(character)) {
                index++;
                continue;
            }

            if (/[0-9.]/.test(character)) {
                const match = expression.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);

                if (!match) {
                    throw new Error("Invalid number");
                }

                tokens.push({ type: "number", value: Number(match[0]) });
                index += match[0].length;
                continue;
            }

            if (/[a-zA-Z_]/.test(character)) {
                const match = expression.slice(index).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
                tokens.push({ type: "name", value: match[0].toLowerCase() });
                index += match[0].length;
                continue;
            }

            if ("+-*/^(),".includes(character)) {
                tokens.push({ type: character, value: character });
                index++;
                continue;
            }

            throw new Error(`Unsupported character: ${character}`);
        }

        tokens.push({ type: "end", value: "" });
        return tokens;
    }

    current() {
        return this.tokens[this.position];
    }

    match(type) {
        if (this.current().type === type) {
            this.position++;
            return true;
        }

        return false;
    }

    parse() {
        const expression = this.parseAddSubtract();

        if (this.current().type !== "end") {
            throw new Error("Unexpected token");
        }

        return expression;
    }

    parseAddSubtract() {
        let left = this.parseMultiplyDivide();

        while (this.current().type === "+" || this.current().type === "-") {
            const operator = this.current().type;
            this.position++;
            const right = this.parseMultiplyDivide();
            const previous = left;

            left = x => operator === "+" ? previous(x) + right(x) : previous(x) - right(x);
        }

        return left;
    }

    parseMultiplyDivide() {
        let left = this.parseUnary();

        while (true) {
            if (this.current().type === "*" || this.current().type === "/") {
                const operator = this.current().type;
                this.position++;
                const right = this.parseUnary();
                const previous = left;

                left = x => operator === "*" ? previous(x) * right(x) : previous(x) / right(x);
                continue;
            }

            if (this.startsImplicitMultiplication()) {
                const right = this.parseUnary();
                const previous = left;
                left = x => previous(x) * right(x);
                continue;
            }

            break;
        }

        return left;
    }

    startsImplicitMultiplication() {
        return this.current().type === "number" ||
            this.current().type === "name" ||
            this.current().type === "(";
    }

    parseUnary() {
        if (this.match("+")) {
            return this.parseUnary();
        }

        if (this.match("-")) {
            const value = this.parseUnary();
            return x => -value(x);
        }

        return this.parsePower();
    }

    parsePower() {
        const base = this.parsePrimary();

        if (this.match("^")) {
            const exponent = this.parseUnary();
            return x => Math.pow(base(x), exponent(x));
        }

        return base;
    }

    parsePrimary() {
        const token = this.current();

        if (token.type === "number") {
            this.position++;
            return () => token.value;
        }

        if (token.type === "(") {
            this.position++;
            const expression = this.parseAddSubtract();

            if (!this.match(")")) {
                throw new Error("Missing closing parenthesis");
            }

            return expression;
        }

        if (token.type === "name") {
            this.position++;

            if (token.value === "x") {
                return x => x;
            }

            if (token.value === "pi") {
                return () => Math.PI;
            }

            if (token.value === "e") {
                return () => Math.E;
            }

            const functions = {
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                sqrt: Math.sqrt,
                abs: Math.abs,
                log: Math.log10,
                ln: Math.log,
                exp: Math.exp
            };

            if (!functions[token.value] || !this.match("(")) {
                throw new Error(`Unknown name: ${token.value}`);
            }

            const argument = this.parseAddSubtract();

            if (!this.match(")")) {
                throw new Error("Missing closing parenthesis");
            }

            return x => functions[token.value](argument(x));
        }

        throw new Error("Expected a number, x, function, or parenthesis");
    }
}

function createMathFunction(equation) {
    const expression = equation.trim().replace(/^y\s*=\s*/i, "");

    if (!expression) {
        throw new Error("Enter an equation such as y = x^2");
    }

    return new MathExpressionParser(expression).parse();
}

export { createMathFunction };