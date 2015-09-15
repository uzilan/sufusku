module.exports = {
    target: {
        files: [
            {
                expand: true,
                cwd: '<%= appstyles %>',
                src: ['*.css', '!*.min.css'],
                dest: '<%= diststyles %>',
                ext: '.css'
            }, {
                expand: true,
                cwd: 'bower_components/bootstrap/dist/css/',
                src: ['bootstrap.min.css'],
                dest: '<%= diststyles %>',
                ext: '.min.css'
            }, {
                expand: true,
                cwd: 'bower_components/angular-ui/build/',
                src: ['angular-ui.min.css'],
                dest: '<%= diststyles %>',
                ext: '.min.css'
            }


        ]
    }
}