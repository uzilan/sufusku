function getClass(row, col) {
    var className = '';
    if (row == 0) {
        className += ' thick-top';
    }
    if ((row + 1) % 3 == 0) {
        className += ' thick-bottom';
    }
    if (col == 0) {
        className += ' thick-left';
    }
    if ((col + 1) % 3 == 0) {
        className += ' thick-right';
    }
    return className;
}

function updateMatrix(data) {
    $.each(data, function (row, r) {
        $.each(r, function (col, cell) {
            var td = $('tbody')[0].children[row + 1].children[col + 1];
            var input = td.children[0];
            input.value = cell.value == 0 ? '' : cell.value;
            var numbers = td.children[1];
            numbers.innerHTML = cell.numbers;

            var rbColor = cell.numbers.length == 9 ? 255 : 255 - Math.round(255 / cell.numbers.length);
            var color = 'rgb(' + rbColor + ',255,' + rbColor + ')';
            td.style.backgroundColor = color;
            input.style.backgroundColor = color;
            numbers.style.backgroundColor = color;
        });
    });
}

function cellChanged(row, col) {
    var cell = $('tbody')[0].children[row + 1].children[col + 1].children[0];
    var value = cell.value;
    var data = {'row': row, 'col': col, 'value': value};

    $.ajax({
        url: 'matrix',
        dataType: 'json',
        type: 'PUT',
        data: data,
        success: function (result) {
            updateMatrix(result);
        }
    });

    updateLog(row, col, value);
}


$(document).ready(function () {

    $('#table_holder').html('<table cellpadding="0" cellspacing="0" border="1" id="table"></table>');
    $('#table').html('<thead/><tbody id="tbody"></tbody>');

    $.ajax({
        url: 'matrix',
        dataType: 'json',
        success: function (data) {

            $('table').append('<tr class="axis"/>');

            addLetters();

            $.each(data, function (row, r) {

                $('table').append('<tr/>');

                addNumber(row);

                $.each(r, function (col, cell) {
                    addCell(row, col, cell);
                });
            });
        }
    });
});

function addLetters() {
    $.each([' ', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], function (x, l) {
        var letterTd = $('<td/>', {
            class: 'axis-top',
            html: l
        });

        $("table tr:last").append(letterTd);
    });
}

function addNumber(row) {
    var numberTd = $('<td/>', {
        class: 'axis-left',
        html: row + 1
    });

    $("table tr:last").append(numberTd);
}

function addCell(row, col, cell) {
    var numbers = $('<div/>', {
        class: 'numbers',
        html: cell.numbers
    });

    var input = $('<input/>', {
        type: 'number',
        class: 'input',
        html: cell.value == 0 ? '' : cell.value
    }).change(function () {
        cellChanged(row, col);
    });

    var td = $('<td/>', {
        class: getClass(row, col),
        html: input
    }).append(numbers);

    $("table tr:last").append(td);
}


