module.exports = {
    //styles: {
    //    files: ['<%= app %>/styles/*.scss', '<%= app %>/areas/**/*.scss', '<%= app %>/common/**/*.scss'],
    //    tasks: ['sass_globbing', 'sass', 'clean:sass', 'cssmin'],
    //    options: {
    //        livereload: true,
    //        livereloadOnError: false
    //    }
    //},
    scripts: {
        files: ['<%= app %>/**/*.js'],
        tasks: ['ngAnnotate', 'uglify'],
        options: {
            livereload: true,
            livereloadOnError: false
        }
    },
    html: {
        files: ['<%= app %>/**/*.html'],
        tasks: ['htmlmin'],
        options: {
            livereload: true,
            livereloadOnError: false
        }
    },
    serve: {
        files: ['<%= app %>/index.html'],
        tasks: ['copy'],
        options: {
            livereload: true,
            livereloadOnError: false
        }
    },
    gruntfile: {
        files: ['Gruntfile.js', 'grunt/*.js'],
        options: {
            reload: true
        }
    }
};
