var stack = (function stackFactory() {

    this.stack = [];
     
    // Initialize our Stack.
    function Stack(data) {
        if (typeof data === 'object') {
            this.stack = data;
        }
        else {
            this.stack = [];
        }
    }

    /** Stack Operations. */
    Stack.prototype.push = function pushStack(item) { this.stack.push(item); }
    Stack.prototype.pop = function popStack() { return this.stack.pop(); }
    Stack.prototype.peek = function peekStack() { return this.stack[this.stack.length-1]; } 

    return {
        Stack: Stack
    };
})();

module.exports = {
    Stack: stack.Stack
};