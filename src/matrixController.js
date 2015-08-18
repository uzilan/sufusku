angular.module('sufusku', [])
    .controller('MatrixController', ['$scope', function ($scope) {

        $scope.matrix = new Matrix();

        $scope.cellChanged = function (cell) {
            $scope.matrix.setValue.call($scope.matrix, cell.row, cell.col, cell.value);
        };


        $scope.getColor = function(cell) {
            var numbersLength = cell.numbers.length;
            var rbColor = numbersLength == 9 ? 255 : 255 - Math.round(255 / numbersLength);
            var color = 'rgb(' + rbColor + ',255,' + rbColor + ')';
/*
            if (cell.isCrazy) {
                color = 'lightcoral';
            } else if (numbersLength == 1 && input.value == '') {
                color = 'deepskyblue';
            }
*/
           return color;
        };

        $scope.getTDStyle = function (row, col) {
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
        }
    }]);

