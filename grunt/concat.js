module.exports = {
    options: {
        stripBanners: true
    },
    components: {
        src: [
            '<%= app %>/../bower_components/angular/angular.min.js',
            '<%= app %>/../bower_components/bootstrap/dist/bootstrap.min.js',
            '<%= app %>/../bower_components/lodash/lodash.min.js'
        ],
        dest: '<%= dist %>/scripts/components.js'
    }
};
