sufusku.factory('LogService', function () {

    var vm = this;

    vm.addItem = function (log, row, col, value) {
        log.addItem(row, col, value);
    };

    return {
        addItem: vm.addItem
    }
});