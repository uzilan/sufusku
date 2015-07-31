angular.module('sufusku', ['matrixServiceModule'])
    .controller('MatrixController', ['$scope', 'MatrixService', function ($scope, MatrixService) {

        this.test = MatrixService.test();
    }]);

