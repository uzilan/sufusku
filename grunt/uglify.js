module.exports = {
    dist: {
        files: [
            {
                dest: '<%= distscripts %>/app.min.js',
                src: [ '<%= distscripts %>/app.js' ]
            }
        ]
    }
};
