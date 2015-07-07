function updateLog(i, j, value) {

    var log = $('#log');
    var logHolder = $('#log_holder');

    log.children('a').each(function () {
        this.className = "list-group-item";
    });

    var logRow = $('<a/>', {
        class: "list-group-item active",
        href: "#",
        html: "(" + getLetter(j) + "," + (i + 1) + ") : " + value
    });
    log.append(logRow);

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