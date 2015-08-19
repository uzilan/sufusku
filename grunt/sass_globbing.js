module.exports = {
    application: {
        files: {
            '<%= appstyles %>/_importMap.scss': ['<%= app %>/areas/**/*.scss', '<%= app %>/common/**/*.scss', '<%= app %>/styles/directives/**/*.scss']
        },
        options: {
            useSingleQuoates: true
        }
    }
};
