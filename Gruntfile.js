module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      my_target: {
        files: [{
          expand: true,
          cwd: 'src',
          src: '**/*.js',
          dest: 'dest'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-serve');

  grunt.registerTask('default', ['uglify']);
};