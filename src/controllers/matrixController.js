sufusku.controller('MatrixController', ['$scope', 'Matrix', 'Log', 'MatrixService', 'LogService',
    function ($scope, Matrix, Log, MatrixService, LogService) {
        $scope.matrix = Matrix;
        $scope.log = Log;

        $scope.cellChanged = function (cell, oldValue) {
            $scope.matrix.setValue.call($scope.matrix, cell.row, cell.col, cell.value, oldValue);
            $scope.matrix.checkMatrixForCraziness.call($scope.matrix);
            var matrixClone = $scope.matrix.clone.call($scope.matrix);
            LogService.addItem($scope.log, cell.row, cell.col, cell.value, matrixClone);
        };


        $scope.getColor = function (cell) {
            return MatrixService.getColor(cell);
        };

        $scope.getTDStyle = function (row, col) {
            return MatrixService.getTDStyle(row, col);
        }
    }]);