function reset() {
    $.ajax({
        url: 'reset',
        dataType: 'json',
        success: function (result) {
            updateMatrix(result);
            resetLog();
        }
    });
}