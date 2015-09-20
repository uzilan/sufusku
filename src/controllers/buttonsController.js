sufusku.controller('ButtonsController', ['$scope', 'Log', 'Matrix',
    function ($scope, Log, Matrix) {
        $scope.log = Log;
        $scope.matrix = Matrix;

        $scope.reset = function () {

            $scope.matrix.reset.call($scope.matrix);
            $scope.log.reset.call($scope.log);
        };

        $scope.baseline = function() {
            $scope.matrix.setBaseline.call($scope.matrix);
        };

        $scope.resetToBaseline = function() {
            $scope.matrix.resetToBaseline.call($scope.matrix);
            $scope.log.reset.call($scope.log);
        }

    }]);

