var Matrix = function () {

    this.matrix = new Array(9);

    for (row = 0; row < 9; row++) {
        this.matrix[row] = new Array(9);
        for (cell = 0; cell < 9; cell++) {
            this.matrix[row][cell] = new Cell(row, cell, getGroupIndex(row, cell));
        }
    }

    function getGroup(matrix, row, col) {

        var gb = getGroupBounderies(row, col);

        var group = [];

        for (var i = gb.minX; i < gb.maxX; i++) {
            for (var j = gb.minY; j < gb.maxY; j++) {
                group.push(matrix[i][j]);
            }
        }
        return group;
    }

    function getGroupIndex(row, col) {

        var gb = getGroupBounderies(row, col);

        if (gb.minX === 0) {
            if (gb.minY === 0) {
                return 1;
            } else if (gb.minY === 3) {
                return 2;
            } else {
                return 3;
            }
        } else if (gb.minX === 3) {
            if (gb.minY === 0) {
                return 4;
            } else if (gb.minY === 3) {
                return 5;
            } else {
                return 6;
            }
        } else {
            if (gb.minY === 0) {
                return 7;
            } else if (gb.minY === 3) {
                return 8;
            } else {
                return 9;
            }
        }
    }


    function getGroupBounderies(row, col) {

        var minX, maxX, minY, maxY;

        if (row >= 0 && row < 3) {
            minX = 0;
            maxX = 3;
        } else if (row >= 3 && row < 6) {
            minX = 3;
            maxX = 6;
        } else {
            minX = 6;
            maxX = 9;
        }

        if (col >= 0 && col < 3) {
            minY = 0;
            maxY = 3;
        } else if (col >= 3 && col < 6) {
            minY = 3;
            maxY = 6;
        } else {
            minY = 6;
            maxY = 9;
        }

        return {minX: minX, maxX: maxX, minY: minY, maxY: maxY}
    }

    var removeNumberFromCell = function (cell, value) {
        cell.numbers = cell.numbers.replace(new RegExp(value), '');
    };


    function checkIfCellIsCrazy(matrix, row, col) {
        var value = matrix[row][col].value;
        var isCrazy = false;
        var i, cell;

        if (value === '') {
            return false;
        }

        for (i = 0; i < 9; i++) {
            cell = matrix[row][i];
            if (cell.col !== col && cell.value === value) {
                isCrazy = true;
            }
        }

        for (i = 0; i < 9; i++) {
            cell = matrix[i][col];
            if (cell.row !== row && cell.value === value) {
                isCrazy = true;
            }
        }

        var group = getGroup(matrix, row, col);

        for (i = 0; i < 9; i++) {
            cell = group[i];
            if (cell.row !== row && cell.col !== col && cell.value === value) {
                isCrazy = true;
            }
        }

        return isCrazy;
    }

    this.setValue = function (row, col, value) {

        var cell;
        for (cell = 0; cell < 9; cell++) {
            removeNumberFromCell(this.matrix[row][cell], value);
        }

        for (cell = 0; cell < 9; cell++) {
            removeNumberFromCell(this.matrix[cell][col], value);
        }

        var group = getGroup(this.matrix, row, col);

        for (cell = 0; cell < 9; cell++) {
            removeNumberFromCell(group[cell], value);
        }
    };

    this.checkMatrixForCraziness = function () {
        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                this.matrix[i][j].isCrazy = checkIfCellIsCrazy(this.matrix, i, j);
            }
        }
    };
};
