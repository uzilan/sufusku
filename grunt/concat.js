module.exports = {
    options: {
        stripBanners: true
    },
    components: {
        src: [
            '<%= app %>/bower_components/angular/angular.min.js'
        ],
        dest: '<%= dist %>/scripts/components.js'
    }
};
