sufusku.controller('HelpController', ['$scope', 'Log', 'Matrix',
    function ($scope, Log, Matrix) {
        $scope.log = Log;
        $scope.matrix = Matrix;

        $scope.helpIsActive = false;

        $scope.toggleHelp = function () {
            $scope.helpIsActive = !$scope.helpIsActive;
        }
    }]);