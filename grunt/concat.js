module.exports = {
    options: {
        stripBanners: true
    },
    components: {
        src: [
            '<%= app %>/../bower_components/angular/angular.min.js',
            '<%= app %>/../bower_components/angular-ui/build/angular-ui.min.js',
            '<%= app %>/../bower_components/bootstrap/dist/bootstrap.min.js',
            '<%= app %>/../bower_components/lodash/lodash.min.js',
            '<%= app %>/../bower_components/jquery/dist/jquery.min.js'
        ],
        dest: '<%= dist %>/scripts/components.js'
    }
};
