module.exports = function (grunt) {
    var appname = require('./package.json').name;

    require('load-grunt-config')(grunt, {
        // data passed into config.  Can use with <%= dist %>
        data: {
            dist: 'dist/' + appname,
            app: 'src',
            distscripts: 'dist/' + appname + '/scripts',
            diststyles: 'dist/' + appname + '/styles',
            disthtml: 'dist/' + appname,
            disttest: 'dist/' + appname + '/test',
            appstyles: 'src/css'
        }
    });

    require('time-grunt')(grunt);

    grunt.registerTask('build', ['clean:dist', 'ngAnnotate:application', 'uglify', 'htmlmin', 'imagemin', 'cssmin', 'copy:serve', 'copy:server', 'concat:components']);

    grunt.registerTask('serve', ['build', 'connect:livereload', 'watch']);

    grunt.registerTask('default', function () {
        grunt.task.run(['build']);
    });
};
