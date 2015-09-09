sufusku.controller('MatrixController', ['$scope', 'MatrixService', 'LogService', function ($scope, MatrixService, LogService) {
    $scope.matrix = new Matrix();
    $scope.log = new Log();

    $scope.cellChanged = function (cell, oldValue) {
        $scope.matrix.setValue.call($scope.matrix, cell.row, cell.col, cell.value, oldValue);
        $scope.matrix.checkMatrixForCraziness.call($scope.matrix);
        LogService.addItem($scope.log, cell.row, cell.col, cell.value);
    };

    $scope.getColor = function (cell) {
        return MatrixService.getColor(cell);
    };

    $scope.getTDStyle = function (row, col) {
        return MatrixService.getTDStyle(row, cell);
    }
}]);