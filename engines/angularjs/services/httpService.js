define(['angularAMD', 'dateUtilService', 'utilService','stateService','localPersistenceService'], function (angularAMD) {
    'use strict';

    angularAMD.service('httpService', function ($rootScope, $parse, $q, $http, $httpParamSerializer, $urlRouter, $window, constants, Notification,
        overlay, localPersistenceService, utilService, stateService, dateUtilService,  _) {
        var self = this;
        var logOutRedirectPath = "app.logout";
        var contentTypeMap = {
            "pdf": "application/pdf",
            "excel": "application/ms-excel"
        };
        var requestOptionsDefaults = {
            "method": "GET",
            "inputType": "JSON",
            "reqType": "secure"
        };

        var headerDataSource = {
            "login": localPersistenceService,
            "secure": function () {
                return localPersistenceService.get("auth", true);
            }
        };
        /*  $scope.encoded = btoa("clientIdPassword:secret");*/
        var httpGlobalHeaderMap = {
            "login": {
                "Authorization": "Basic dmVuaGFuLXRydXN0ZWQtY2xpZW50OlZlbmhhbi1JRFM=",
                'X-LoginTenantCode': '{{loginTenantCode}}',
                "Content-type": "application/x-www-form-urlencoded; charset=utf-8"
            }, "secure": {
                "Authorization": "Bearer {{access_token}}",
                'X-LoginTenantCode': '{{loginTenantCode}}',
                'X-TenantCode': '{{tenantCode}}||{{loginTenantCode}}',
                'X-TenantId': '{{tenantId}}||{{loginTenantId}}'
            }
        };
        var getFullUrl = function (urlRoute) {
            var url;

            if (urlRoute && (urlRoute.startsWith("https") || urlRoute.startsWith("http"))) {
                url = urlRoute;
            }
            else {
                if (!urlRoute.startsWith("/") && !constants.api_url.endsWith("/")) {
                    urlRoute = "/" + urlRoute;
                }
                url = constants.api_url + urlRoute;
            }
            console.log("CurrentAppDefKey",stateService.getCurrentAppDefKey());
            //if (urlRoute && !urlRoute.startsWith(constants.api_url)) {
            //    if (!urlRoute.startsWith("/") && !constants.api_url.endsWith("/")) {
            //        urlRoute = "/" + urlRoute;
            //    }
            //    url = constants.api_url + urlRoute;
            //}
            //else {
            //    url = urlRoute;
            //}
            console.log("urlRoute=", urlRoute);

            //if(urlRoute=="mailDashBoard?tenantCode=tsg"){
            //    url= "http://developeriis.chrims.com:91/mailDashBoard"; 
            //}

            return url;
        };
        var buildHeader = function (reqType) {
            var source = headerDataSource[reqType];
            var headers = {};
            if (angular.isFunction(source)) {
                source = source();
            }
            var headerKeyMap = httpGlobalHeaderMap[reqType];
            for (var key in headerKeyMap) {
                var valueExp = headerKeyMap[key];
                var value = valueExp;
                if (valueExp.indexOf("{{") > -1 && valueExp.indexOf("}}") > -1)
                    value = utilService.evaluateExpression(valueExp, source);
                 if (value.indexOf("{{") === -1 && value.indexOf("}}") === -1)
                     headers[key] = value;
            }

            return headers;
        };
        var buildRequest = function (options) {
            options = utilService.removeUndefined(options);
            options = angular.extend({}, requestOptionsDefaults, options);

            var method = options["method"];
            var reqType = options["reqType"];

            var url = getFullUrl(options["urlRoute"]);
            var data = options["dataAsJson"];

            var headers = buildHeader(reqType);

            var inputType = options["inputType"];
            var dataType;
            if ((inputType === "FORM_DATA" || inputType === "FD" || method === "GET")
                && angular.isDefined(data)) {
                data = $httpParamSerializer(data);
            }
            else {
                data = JSON.stringify(data);
                dataType = "json";
            }
            if (method === "GET" && angular.isDefined(data)) {
                if (url.indexOf("?") === -1) {
                    url = url + "?";
                }
                url = url + data;
            }
            var optionHeaders = utilService.removeUndefined(options["headers"]);
            headers = angular.extend({}, headers, optionHeaders);

            var req = { "url": url, "method": method, "data": data, "dataType": dataType, "headers": headers };
            var reqOptions = utilService.removeUndefined(options["reqOptions"]);
            req = angular.extend({}, req, reqOptions);

            return req;
        };

        var successCallback = function (response) {
            overlay.hide();
            //var data = response.data;
            //var status = response.status;
            //var error = response.error;
            //var config = response.config;
        }
        var errorCallback = function (response) {
            overlay.hide();
            var data = response.data;
            var status = response.status;
            var error = response.error;
            var config = response.config;

            // error msgs from server
            if (status === 401 || data.code === 401) {
                overlay.showMessage({
                    messageStatus: false,
                    messageText: data.message,
                    redirectPath: logOutRedirectPath
                });
                stateService.navigateToState(logOutRedirectPath);
            } else if (status === 500) {
                overlay.showMessage({
                    messageStatus: data.success,
                    messageText: data.message,
                    messageCode: data.code
                });
                $timeout(function () {
                    overlay.hideMessage();
                }, 6000);


            } else
                if (status === 0 || status === -1)
                    Notification.error({ message: 'Issue might be with network or server', title: 'CODE ERROR - ' + status, delay: 3000 });
                else
                    Notification.error({ message: 'SERVICE URL<br/><br/>' + config.url, title: 'CODE ERROR - ' + status, delay: 3000 });

        };
        var executeRequest = function (req) {
            var defer = $q.defer();
            if(req){
            var res = $http(req).then(function (response) {
                successCallback(response);
                defer.resolve(response);
            }, function (response) {
                errorCallback(response);
                defer.reject(response);
            });
        }

            return defer.promise;
        }
        this.executeByMethod = function (url, dataAsJson, method, reqType, reqOptions, inputType,headers) {
            var options = {
                "urlRoute": url, "dataAsJson": dataAsJson, "method": method, "reqType": reqType,
                "reqOptions": reqOptions, "inputType": inputType,"headers":headers
            };
            // need to  session timeout Check 
            // debugger;
            // session timeout Check
            utilService.sessionTimeOutCheck();
            var req = buildRequest(options);
            return executeRequest(req);
        };
        //urlRoute, method, dataJson, inputType, reqType,headerDataSource, reqOptions
        this.get = function (url, dataAsJson) {
            return self.executeByMethod(url, dataAsJson);
        };
        this.getPdf = function (url, dataAsJson) {
            return self.executeByMethod(url, dataAsJson, "get", "secure", { responseType: 'arraybuffer' });
        };
        this.getFileByPost = function (url, dataAsJson) {
            return self.executeByMethod(url, dataAsJson, "post", "secure", { responseType: 'arraybuffer' });
        };
        this.put = function (url, dataAsJson) {
            return self.executeByMethod(url, dataAsJson, "put");
        };
        this.delete = function (url) {
            return self.executeByMethod(url, dataAsJson, "delete");
        };
        this.post = function (url, dataAsJson) {
            return self.executeByMethod(url, dataAsJson, "post");
        };
        this.loginPost = function (url, dataAsJson) {
            var headers= {"X-AuthProvider":"webportal"};
            return self.executeByMethod(url, dataAsJson, "post", "login", null, "FD",headers);
        };
        this.openFile = function (url, dataAsJson, fileType, fileName) {
            var defer = $q.defer();
            self.getPdf(url, dataAsJson)
                .then(function (results) {
                    console.log("openFile data----", results);
                    overlay.hide();
                    if (results && results.data) {
                        results = results.data;
                    }
                    var contentType = contentTypeMap[fileType];
                    var file = new Blob([results], { type: contentType });
                    var fileURL = URL.createObjectURL(file);
                    $window.open(fileURL, '_blank');

                    defer.resolve(results);
                    //$rootScope.pdfDefaultSettings();
                    // $window.open(fileURL, '_blank');
                    //var link = document.createElement('a');
                    //link.href = fileURL;
                    //link.download =  (fileName || "Report") + "_" + new Date() + ".pdf";
                    //link.click();
                });
            return defer.promise;
        };

        this.openFileByPost = function (url, dataAsJson, fileType, fileName) {
            var defer = $q.defer();
            self.getFileByPost(url, dataAsJson)
                .then(function (results) {
                    console.log("openFile data----", results);
                    overlay.hide();
                    if (results && results.data) {
                        results = results.data;
                    }
                    var contentType = contentTypeMap[fileType];
                    var file = new Blob([results], { type: contentType });
                    var fileURL = URL.createObjectURL(file);
                    // $window.open(fileURL, '_blank');
                    var anchor = document.createElement("a");
                    anchor.download = fileName;
                    anchor.href = fileURL;
                    anchor.click();
                    defer.resolve("Downloaded");
                    //$rootScope.pdfDefaultSettings();
                    // $window.open(fileURL, '_blank');
                    //var link = document.createElement('a');
                    //link.href = fileURL;
                    //link.download = (fileName || "Report") + "_" + new Date() + ".pdf";
                    //link.click();
                });
            return defer.promise;
        };

    });


    return angularAMD;
});
