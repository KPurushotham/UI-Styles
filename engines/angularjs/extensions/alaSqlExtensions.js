define(['angularAMD', 'platform-main-module','dateUtilService', 'common', 'alasql'], function (angularAMD, dateUtilService) {
    'use strict';
    var app = angular.module('platform-main-module');
    app.run(['dateUtilService', 'alasql',
        function (dateUtilService, alasql) {
            console.log("alaSqlExtensions Run");
            alasql.fn.convertToDBFormat = function (dateStr) {
                var date = dateUtilService.convertToDBFormat(dateStr);
                return date;
            };
            alasql.fn.convertFromDBFormat = function (dateStr) {
                var date = dateUtilService.convertFromDBFormat(dateStr);
                console.log(dateStr, date);
                return date;
            };
        }]);
 
    return angularAMD;
});