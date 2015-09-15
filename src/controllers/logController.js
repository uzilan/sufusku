sufusku.controller('LogController', ['$scope', 'Log', 'Matrix', 'LogService',
    function ($scope, Log, Matrix, LogService) {
        $scope.log = Log;
        $scope.matrix = Matrix;

        $scope.getCellText = function (item) {
            return (item.row + 1) + ',' + getLetter(item.col) + ': ' + item.value;
        };

        function getLetter(i) {
            return String.fromCharCode('a'.charCodeAt(0) + i);
        }

        $scope.itemClicked = function (item) {
            $scope.matrix.matrix = item.matrix;
        }

    }]);