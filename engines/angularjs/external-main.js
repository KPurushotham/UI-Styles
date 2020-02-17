base
require.config({
    baseUrl: 'engines/',

    // alias libraries paths.  Must set 'angular'
    paths: {
        
        'engine-main': 'engine-main'
    },

    // Add angular modules that does not support AMD out of the box, put it in a shim
    shim: {
        'angular': ['jQuery'],
        'jQuery-template': ['jQuery'],
        'selectize': ['angular'],
        'angular-route': ['angular'],
        'angular-touch': ['angular'],
        'angular-carousel': ['angular-touch'],
        'angularAMD': ['angular'],
        'ngload': ['angularAMD'],
        'angular-resource': ['angular'],
        'angular-ui-router': ['angular'],
        'angular-selectize': ['selectize'],
        'angular-ivh-treeview': ['angular'],
        'angular-ui-bootstrap': ['angular'],
        'angular-datepicker': ['angular'],
        'moment': ['angular'],
        'daterangepicker': ['angular'],
        'ui-grid': ['angular'],
        'uiGridRowEditService': ['angular'],  
        'ngmultiDatePicker':['angular'],
        'ngdatepicker': ['angular'],        
        'ngtimepicker': ['angular'],
        'notify': ['angular'],
        'angular-growl': ['angular'],
        'angucomplete': ['angular'],
        'DlhSoft': ['angular']
        /*'csvlib':['angular'],
        'pdflib':['angular'],
        'vfsfonts':['pdflib']*/
    },

    // kick start application
    deps: ['app']
});
