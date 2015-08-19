module.exports = {
    options: {
        sourceMap: false,
        outputStyle: 'nested'
    },
    application: {
        files: {
            '<%= diststyles %>/main.css': '<%= appstyles %>/main.scss'
        }
    }
};
