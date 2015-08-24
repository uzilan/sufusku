module.exports = {
    options: {
        singleQuotes: true
    },
    application: {
        files: {
            '<%= distscripts %>/app.js': [
                '<%= app %>/**/*.js', '!<%= app %>/server.js'
            ]
        }
    }
};
