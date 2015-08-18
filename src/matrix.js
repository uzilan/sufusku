var Matrix = function () {

    this.matrix = new Array(9);

    for (row = 0; row < 9; row++) {
        this.matrix[row] = new Array(9);
        for (cell = 0; cell < 9; cell++) {
            this.matrix[row][cell] = new Cell(row, cell, 0);
        }
    }

    var removeNumberFromCell = function (cell, value) {
        cell.numbers = cell.numbers.replace(new RegExp(value), '');
    };

    this.setValue = function (row, col, value) {


        for (cell = 0; cell < 9; cell++) {
            removeNumberFromCell(this.matrix[row][cell], value);
        }

        for (cell = 0; cell < 9; cell++) {
            removeNumberFromCell(this.matrix[cell][col], value);
        }
    }
};
