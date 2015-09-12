var Log = function() {

    this.log = [];

    this.addItem = function(row, col, value, matrix) {
        this.log.push({row: row, col: col, value: value, matrix: matrix});
    }
};