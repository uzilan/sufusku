var Cell = function (row, col, group) {

    this.reset = function () {
        this.value = '';
        this.numbers = '123456789';
        this.baseline = false;
        this.isCrazy = false;
    };

    this.row = row;
    this.col = col;
    this.group = group;
    this.reset();
};