var sufusku = angular.module('sufusku', []);

sufusku.factory('Matrix', function () {
    return new Matrix();
});

sufusku.factory('Log', function () {
    return new Log();
});




sufusku.directive('ngConfirmClick', [
    function(){
        return {
            priority: -1,
            restrict: 'A',
            link: function(scope, element, attrs){
                element.bind('click', function(e){
                    var message = attrs.ngConfirmClick;
                    if(message && !confirm(message)){
                        e.stopImmediatePropagation();
                        e.preventDefault();
                    }
                });
            }
        }
    }
]);


