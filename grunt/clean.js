module.exports = {
    dist: {
        files: [{
            dot: true,
            src: [
                '<%= dist %>/*',
                '!<%= dist %>/.git*'
            ]
        }]
    },
    sass: {
        files: [{
            dot: true,
            src: [
                '<%= appstyles %>/_importMap.scss'
            ]
        }]
    }
};
