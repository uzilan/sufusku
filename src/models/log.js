var Log = function() {

    this.log = [];

    this.addItem = function(row, col, value) {
        this.log.push({row: row, col: col, value: value});
    }
};