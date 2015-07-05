function getClass(i, j) {
    var className = '';
    if (i == 0) {
        className += ' thick-top';
    }
    if ((i + 1) % 3 == 0) {
        className += ' thick-bottom';
    }
    if (j == 0) {
        className += ' thick-left';
    }
    if ((j + 1) % 3 == 0) {
        className += ' thick-right';
    }
    return className;
}

function update(data) {
    $.each(data, function (i, r) {
        $.each(r, function (j, c) {
            var td = $('tbody')[0].children[i + 1].children[j + 1];
            var input = td.children[0];
            input.value = c.value == 0 ? '' : c.value;
            var numbers = td.children[1];
            numbers.innerHTML = c.numbers;

            var rbColor = c.numbers.length == 9 ? 255 : 255 - Math.round(255 / c.numbers.length);
            var color = 'rgb(' + rbColor + ',255,' + rbColor + ')';
            td.style.backgroundColor = color;
            input.style.backgroundColor = color;
            numbers.style.backgroundColor = color;
        });
    });


}

function change(i, j) {
    var cell = $('tbody')[0].children[i + 1].children[j + 1].children[0];
    var value = cell.value;
    var data = {'row': i, 'col': j, 'value': value};

    $.ajax({
        url: 'matrix',
        dataType: 'json',
        type: 'PUT',
        data: data,
        success: function (result) {
            update(result);
        }
    });

    $('#log').children('a').each(function() {
        this.className = "list-group-item";
    });

    var logRow = $('<a/>', {
        class: "list-group-item active",
        href: "#",
        html: "(" + getLetter(j) + "," + (i + 1) + ") : " + value
    });
    $('#log').append(logRow);

    $('#log_holder').scrollTop($('#log_holder')[0].scrollHeight);
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

$(document).ready(function () {

    $('#table_holder').html('<table cellpadding="0" cellspacing="0" border="1" id="table"></table>');
    $('#table').html('<thead/><tbody id="tbody"></tbody>');

    $.ajax({
        url: 'matrix',
        dataType: 'json',
        success: function (data) {

            $('table').append('<tr class="axis"/>');
            $.each([' ', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], function (x, l) {
                var letterTd = $('<td/>', {
                    class: 'axis-top',
                    html: l
                });

                $("table tr:last").append(letterTd);
            });

            $.each(data, function (i, r) {

                $('table').append('<tr/>');

                var numberTd = $('<td/>', {
                    class: 'axis-left',
                    html: i + 1
                });

                $("table tr:last").append(numberTd);

                $.each(r, function (j, c) {


                    var numbers = $('<div/>', {
                        class: 'numbers',
                        html: c.numbers
                    });

                    var input = $('<input/>', {
                        type: 'number',
                        class: 'input',
                        html: c.value == 0 ? '' : c.value
                    }).change(function () {
                        change(i, j);
                    });

                    var td = $('<td/>', {
                        class: getClass(i, j),
                        html: input
                    }).append(numbers);

                    $("table tr:last").append(td);

                });
            });
        }
    });
});

function reset() {
    $.ajax({
        url: 'reset',
        dataType: 'json',
        success: function (result) {
            update(result);
        }
    });
}