sufusku.factory('MatrixService', function () {

    var vm = this;

    vm.getColor = function (cell) {
        var numbersLength = cell.numbers.length;

        var rbColor;
        if (numbersLength === 0) {
            rbColor = 0;
        } else if (numbersLength === 9) {
            rbColor = 255;
        } else {
            rbColor = 255 - Math.round(255 / numbersLength);
        }

        var color = 'rgb(' + rbColor + ',255,' + rbColor + ')';

        if (cell.isCrazy) {
            color = 'lightcoral';
        } else if (numbersLength === 1 && cell.value === '') {
            color = 'deepskyblue';
        }

        return color;
    };

    vm.getTDStyle = function (row, col) {
        var style = '';
        if (col === 0) {
            style += 'thick-left';
        }
        if ((col + 1) % 3 === 0) {
            style += ' thick-right';
        }
        if (row === 0) {
            style += ' thick-top';
        }
        if ((row + 1) % 3 === 0) {
            style += ' thick-bottom';
        }
        return style;
    };

    return {
        getColor: vm.getColor,
        getTDStyle: vm.getTDStyle
    }

});