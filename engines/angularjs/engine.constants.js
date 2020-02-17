define(['angularAMD'], function (angularAMD) {
    'use strict';

    var IMAGES_ROOT = 'assets/img/';

    angularAMD.constant('layoutSizes', {
        resWidthCollapseSidebar: 1200,
        resWidthHideSidebar: 500
    })
        .constant('constants', {
            api_url: config.api_url.url, 
            successStatus: "Success",
            errorStatus: "Failure",
            recordSave: "Record submitted successfully",
            checkSave: "Please check your Details",
            recordUpdate: "Record submitted successfully",
            formValid: "Please fill mandatory fields",
            serviceError: "There is a problem with service",
            notificationUpdate: "Record submitted successfully",
            notificationFail: "Your notification has failed",
            generateBill: "Posted to accounts successfully"
        }).constant('tenantConstants', {
            "defaultTenantCode": "ids",
            "clientAccessToken": "Basic dmVuaGFuLXRydXN0ZWQtY2xpZW50OlZlbmhhbi1JRFM="
        })
        .constant('apiUrlJobRepository', {
            //"JOB_PROCESS":'http://172.16.41.162:8181/' //UAT
              "JOB_PROCESS":'http://172.16.41.165:8181/' // QA
        })
        .constant("dashboardConfig", {
            "tenants-dashboard": {
                'templateUrl': 'engines/angularjs/components/dashboard/views/tenants-dashboard.html',
                "controllerUrl": 'components/dashboard/controllers/tenants-dashboard-controller',
                "controllerName": "tenantsDashboardController"
            },
            "apps-dashboard": {
                'templateUrl': 'engines/angularjs/components/dashboard/views/apps-dashboard.html',
                "controllerUrl": 'components/dashboard/controllers/apps-dashboard-controller',
                "controllerName": "appsDashboardController"
            }
        })
        .constant("menuGlobalDefaultConfig", {
        })
        .constant("screenGlobalDefaultConfig", {
            cache: false
        })
        .constant("appDefaultConfig", {
            "default": {
                menuPosition: "T",
                templateUrl: "engines/angularjs/components/jsonbasedpages/views/app-main.html",
                controller: "components/jsonbasedpages/controllers/app-main-controller",
                viewContainer: "bodysection"
            },
            "dashboard":{
                menuPosition: "T",
                templateUrl: "engines/angularjs/components/dashboard/views/reports-dashboard.html",
                controller: "components/dashboard/controllers/reports-dashboard-controller",
                viewContainer: "bodysection"
            }
        })
        .constant("stateDefinitionConfig", {
            "name": "key|stateName",
            "url": "url|urlRoute",
            "data": "data",
            "abstract": { defaultValue: false },
            "views": { "name": "viewName|viewContainer", "templateUrl": "templateUrl", "controllerUrl": "controller" }
        })
        .constant("screenViewDefaultConfig", {
            LISTING: {
                templateUrl: "engines/angularjs/components/jsonbasedpages/views/listing-screen.html",
                controllerUrl: "components/jsonbasedpages/controllers/listing-screen-controller"
            },
            FORM: {
                templateUrl: "engines/angularjs/components/jsonbasedpages/views/form-screen.html",
                controllerUrl: "components/jsonbasedpages/controllers/form-screen-controller"
            },
            DASHBOARD: {
                templateUrl: "engines/angularjs/components/jsonbasedpages/views/dashboard.html",
                controllerUrl: "components/jsonbasedpages/controllers/dashboard-controller"
            },
            REPORT: {
                templateUrl: "engines\angularjs\components\dashboard\views\reports-dashboard.html",
                controllerUrl: "engines\angularjs\components\dashboard\controllers\reports-dashboard-controller"
            },
            KANBAN:{
                templateUrl: "engines/angularjs/components/jsonbasedpages/views/kanban.html",
                controllerUrl: "components/jsonbasedpages/controllers/kanban-controller"
            }
        })
        .constant("screenDefaultActions", {
            "LISTING": {
                actions: [{

                }]
            },
            "FORM": {
                "actions": [
                    {
                        title: "Save & Add New",
                        modelKey: "saveAndAddNewButton",
                        navigateTo: "SELF",
                        actionType: "SUBMIT",
                        cssClass: "green_btn",
                        showModes: ["ADD"]
                    },
                    {
                        title: "Save & Close",
                        modelKey: "saveAndCloseButton",
                        navigateTo: "PARENT",
                        actionType: "SUBMIT",
                        cssClass: "green_btn",
                        showModes: ["ADD", "EDIT"]
                    },
                    {
                        title: "Cancel",
                        modelKey: "cancelButton",
                        navigateTo: "VIEW_MODE",
                        cssClass: "gray_btn",
                        actionType: "CANCEL",
                        showModes: ["EDIT"]
                    },
                    {
                        title: "Close",
                        modelKey: "closeButton",
                        navigateTo: "PARENT",
                        cssClass: "gray_btn",
                        actionType: "CLOSE"

                    }]
            },
            "REPORT": 
            [
                {
                title: "Search",
                modelKey: "searchButton",
                navigateTo: "PARENT",
                actionType: "SUBMIT",
                cssClass: "green_btn",
                showModes: ["ADD", "EDIT"]
            },
            {
                title: "Close",
                modelKey: "closeButton",
                navigateTo: "PARENT",
                cssClass: "gray_btn",
                actionType: "CLOSE"

            }],
            "KANBAN":[]
        })
        .constant('layoutPaths', {
            images: {
                root: IMAGES_ROOT,
                profile: IMAGES_ROOT + 'app/profile/',
                amMap: 'assets/img/theme/vendor/ammap//dist/ammap/images/',
                amChart: 'assets/img/theme/vendor/amcharts/dist/amcharts/images/'
            }
        })
        .constant('colorHelper', {
            tint: function (color, weight) {
                return mix('#ffffff', color, weight);
            },
            shade: function (color, weight) {
                return mix('#000000', color, weight);
            },
        })
        .constant("gridColumnMapping", {
            datafieldKey: "field",
            headerText: "headerName",
            width: "width",
            minWidth: "minWidth",
            maxWidth: "maxWidth",
            pinned: "pinned",
            sort: "sort",
            tooltip: "tooltipField",
            headerCssClass: "headerClass",
            cellCssClass: "cellClass",
            editable: "editable",
            hide: "hide",
            cellEditor: "cellEditorType",
            cellEditorParams: "cellEditorParams",
            template: "template",
            cellRenderer: "cellRenderer",
            filterType: "filter",
            rowGroup: "rowGroup",
            actionType: "actionType",
            actionIconClass: "actionIconClass",
            handlerName: "handlerName",
            formater: "formatType",
            treeData:"treeData"

        })
        .constant("gridFeaturesMapping", {
            pagination: "pagination",
            enableSorting: "enableSorting",
            enableGridMenu: "enableGridMenu",
            enableFilter: "enableFilter",
            floatingFilter: "floatingFilter",
            enableColResize: "enableColResize",
            groupMultiAutoColumn: "groupMultiAutoColumn",
            rowGroupPanelShow: "rowGroupPanelShow",
            suppressSizeToFit: "suppressSizeToFit",
            alignedGrids: "alignedGrids",
            paginationAutoPageSize:"paginationAutoPageSize",
            treeData:"treeData",
            groupDefaultExpanded:"groupDefaultExpanded",
            sideBar: "sideBar"
            
        })
        .constant("gridDefaultFeatures", {
            rowHeight: 30,
            headerHeight: 30,
            pagining: true,
            filter: true,
            enableSorting: true,
            pagination: true,
            enableGridMenu: true,
            enableFilter: true,
            floatingFilter: false,
            enableColResize: true,
            groupMultiAutoColumn: true,
            paginationAutoPageSize: false,
            paginationPageSize: 100,
            rowGroupPanelShow: false
        }).constant("fieldPropertiesMapping", {
            fieldTypeCode: "fieldType"
        });

    function shade(color, weight) {
        return mix('#000000', color, weight);
    }

    function tint(color, weight) {
        return mix('#ffffff', color, weight);
    }

    //SASS mix function
    function mix(color1, color2, weight) {
        // convert a decimal value to hex
        function d2h(d) {
            return d.toString(16);
        }
        // convert a hex value to decimal
        function h2d(h) {
            return parseInt(h, 16);
        }

        var result = "#";
        for (var i = 1; i < 7; i += 2) {
            var color1Part = h2d(color1.substr(i, 2));
            var color2Part = h2d(color2.substr(i, 2));
            var resultPart = d2h(Math.floor(color2Part + (color1Part - color2Part) * (weight / 100.0)));
            result += ('0' + resultPart).slice(-2);
        }
        return result;
    }
    return angularAMD;
});
