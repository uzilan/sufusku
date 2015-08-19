module.exports = {
    dist: {
        options: {
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeCommentsFromCDATA: true,
            removeOptionalTags: true
        },
        files: [
            {
                expand: true,
                cwd: '<%= app %>',
                src: '**/*.html',
                dest: '<%= disthtml %>'
            }
        ]
    }
};
