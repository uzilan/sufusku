angular.module('matrixServiceModule', ['matrixResourceModule'])
    .factory('MatrixService',  ['MatrixResource', function(MatrixResource) {

        var test = MatrixResource.test;

        return {
            test: test
        };

    }]);
