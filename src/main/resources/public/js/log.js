function updateLog() {

    var log = $('#log');
    var logHolder = $('#log_holder');

    resetLog();

    $.ajax({
        url: 'log',
        dataType: 'json',
        type: 'GET',
        success: function (result) {
            var len = result.length;
            $.each(result, function (i, r) {
                var logRow = $('<a/>', {
                    class: i == len - 1 ? "list-group-item active" : "list-group-item",
                    href: "#",
                    html: r.coordinates + ": " + r.value
                });
                log.append(logRow);
            });
        }
    });

    $("#log a:last").className = "list-group-item active";

    logHolder.scrollTop(logHolder[0].scrollHeight);
}

function getLetter(i) {
    switch (i) {
        case 0:
            return 'a';
        case 1:
            return 'b';
        case 2:
            return 'c';
        case 3:
            return 'd';
        case 4:
            return 'e';
        case 5:
            return 'f';
        case 6:
            return 'g';
        case 7:
            return 'h';
        case 8:
            return 'i';
    }
}

function resetLog() {
    $('#log').empty();
}