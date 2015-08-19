module.exports = {
    target: {
        files: [{
            expand: true,
            cwd: '<%= appstyles %>',
            src: ['*.css', '!*.min.css'],
            dest: '<%= diststyles %>',
            ext: '.min.css'
        }]
    }
}