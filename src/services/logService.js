sufusku.factory('LogService', function () {

    var vm = this;

    vm.addItem = function (log, row, col, value, matrix) {
        log.addItem(row, col, value, matrix);
    };

    return {
        addItem: vm.addItem
    }
});