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
            var td = $('tbody')[0].children[i].children[j];
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
    console.log('i: ' + i + ", j: " + j);
    var cell = $('tbody')[0].children[i].children[j].children[0];
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
}

$(document).ready(function () {

    $('#table_holder').html('<table cellpadding="0" cellspacing="0" border="1" id="table"></table>');
    $('#table').html('<thead/><tbody id="tbody"></tbody>');

    $.ajax({
        url: 'matrix',
        dataType: 'json',
        success: function (data) {
            $.each(data, function (i, r) {

                $('table').append('<tr/>');

                $.each(r, function (j, c) {


                    var numbers = $('<div/>', {
                        class: 'numbers',
                        html: c.numbers
                    });

                    var input = $('<input/>', {
                        type: 'text',
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