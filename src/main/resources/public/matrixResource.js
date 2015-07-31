angular.module('matrixResourceModule', [])
    .factory('MatrixResource', function () {

        var test = function () {
            return "1,2,3";
        }

        return {
            test: test
        };

    });
