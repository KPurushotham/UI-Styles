define(['angularAMD', 'stateService', 'appDefinitionService', 'menuDefinitionService', 'tenantService'], function (angularAMD) {
    'use strict';

    angularAMD.service('screenDefinitionService', ['$rootScope', '$http', '$q', '$state', '$filter',
        'appDefaultConfig', 'screenGlobalDefaultConfig', 'stateService', 'appDefinitionService',
        'menuDefinitionService', 'tenantService', 'screenDefaultActions', 'httpService', 'fieldPropertiesMapping', 'localPersistenceService', 'overlay',
        function ($rootScope, $http, $q, $state, $filter, appDefaultConfig, screenGlobalDefaultConfig, stateService, appDefinitionService,
            menuDefinitionService, tenantService, screenDefaultActions, httpService, fieldPropertiesMapping, localPersistenceService, overlay) {
            var self = this;

            var extendWithDefaultConfig = function (screenConfig, screenPattern) {
                var defaultActions = screenDefaultActions[screenPattern];
                if (!screenConfig.actions && defaultActions) {
                    screenConfig["actions"] = defaultActions["actions"];
                   // try{
                        if( screenConfig["actions"]){
                            screenConfig["actions"] = defaultActions["actions"];
                        }                        
                    // }
                    // catch(err){

                    // }
                    
                }

                return screenConfig;
            };
            var getScreenConfigUrl = function () {
                var currentAppDefKey = appDefinitionService.getCurrentAppDefKey();
                var menuKey = menuDefinitionService.getActiveMenuKey();
                menuKey = menuKey.substr(currentAppDefKey.length + 1);
                menuKey = menuKey.replace('.', '/');
                var configUrl = 'apps/' + currentAppDefKey + '/config/menu/' + menuKey + '.json?v=' + version;

                return configUrl;
            };
            var isCache = function () {
                return screenGlobalDefaultConfig.cache;
            };

            this.loadCurrentScreenMetaDataByCode = function (screenCode, callback) {
                this.getScreenMetaData(screenCode).then(function (rawScreenConfig) {
                    var screenDefConfig = this.buildScreenMetaDataFromJson();
                    consolelog("111 screenDefConfig=", screenDefConfig);
                    return screenDefConfig;
                });
            };
            var getScreenMetaData = function (screenCode,currentAppId) {
                var defer = $q.defer();
                var url = buildScreenCodeUrl(screenCode,currentAppId);
                httpService.get(url).then(function (result) {
                    defer.resolve(result);
                });
                return defer.promise;
            };

            var buildScreenCodeUrl = function (screenCode,currentAppId) {
              //  var appId = localPersistenceService.get("currentAppId", true);
                if(screenCode){
                    return "report/ui/metadata/" + currentAppId +"/"+screenCode;
                }else{
                    return "report/ui/metadata/1002/AUDIT_CHECK";
                }
               
            };

            this.buildScreenMetaDataFromJson = function (screenCode,currentAppId) {
                var defer = $q.defer();
                getScreenMetaData(screenCode,currentAppId).then(function (result) {
                    console.log("getScreenMetaData ==", result);
                    var sections = [];
                    var uiFileds = result.data.data.criteriaMetadata;
                    var styleConfig = result.data.data["additionalConfig"] || undefined;
                    var dataFormatMapper =[];// result.data.data["templateMetadata"]["modelMapperKeyMap"] || undefined;
                    console.log("dataFormatMapper=", dataFormatMapper);

                    if (uiFileds.length > 0) {
                        var uisections = getSections(uiFileds);
                        if (uisections.length === 0) { //No section availble
                            var section = {};
                            var styleObj = getSectionStyle(styleConfig, 1);
                            section.cssClass = styleObj["cssClass"] || "";
                            section.rowDivisions = buildSectionBasedOnJson(uiFileds, uiSection, styleConfig,dataFormatMapper);
                            section.style = styleObj["inline_style"] || "";
                            section.title = styleObj["title"] || "";

                            sections.push(section);
                        } else {// sections >0
                            angular.forEach(uisections, function (uiSection, key) {
                                var section = {};
                                var sectionNo = uiSection.sectionNo || undefined;
                                var styleObj = getSectionStyle(styleConfig, sectionNo);

                                section.cssClass = styleObj["cssClass"] || "";
                                section.style = styleObj["inline_style"] || "";
                                section.title = styleObj["title"] || "";

                                section.rowDivisions = buildSectionBasedOnJson(uiFileds, sectionNo, styleConfig,dataFormatMapper);
                                sections.push(section);
                            });
                        }
                    }

                    console.log("1112 sections=", sections);
                    var data={
                        sections:sections,
                        metaData:result.data
                    }
                    defer.resolve(data);
                    //return sections;
                });
                return defer.promise;
            };

            var buildSectionBasedOnJson = function (uiFileds, sectionNo, styleConfig,dataFormatMapper) {
                var rowDivisions = [];
                //loop each section
              console.log("111 section buildSectionBasedOnJson=", uiFileds);

                //get rows 
                var rows = getRows(uiFileds, sectionNo);

                //loop each row
                angular.forEach(rows, function (row, key) {
                    var rowNo = row.rowNo;
                    var rowDivision = {};
                    var rowStyleObj = getRowStyle(styleConfig, sectionNo, rowNo);
                    rowDivision.cssClass = rowStyleObj["cssClass"] || "";
                    rowDivision.style = rowStyleObj["inline_style"] || "";
                    rowDivision.columns = [];

                    var columns = getColumns(uiFileds, sectionNo, rowNo);

                    //loop each column
                    angular.forEach(columns, function (col, key) {
                        var column = {};
                        var colNo = col.columnNo;
                        var colStyleObj = getColumnStyle(styleConfig, sectionNo, rowNo, colNo);
                        column.cssClass = colStyleObj["cssClass"] || "";
                        column.style = colStyleObj["inline_style"] || "";

                        //get all fields with in each column
                        var uifields = getFields(uiFileds, sectionNo, rowNo, colNo);
                        //console.log("111 fieldPropertiesMapping:-", fieldPropertiesMapping);
                        //loop each field and build field
                        var fields = [];
                        angular.forEach(uifields, function (uiFiled, key) {
                            var field = {};
                            angular.forEach(uiFiled, function (prop, propKey) {
                                field["mode"]="Edit";
                               // console.log("111 prop=", prop, propKey, getPropKey);
                                if("grid"== prop){
                                    field["gridConfig"] = getGridConfig(uiFiled["additionalConfigMap"]);
                                     console.log("grid featurees==",     field["gridConfig"] );
                                }
                                switch (propKey) {
                                    case "styleConfigMap":
                                        field = getFiledStyleConfig(field, uiFiled);
                                       // console.log("111 field=", field);
                                        break;
                                    case "additionalConfigMap":
                                        var additionalConfigMapList = uiFiled["additionalConfigMap"];
                                        if (additionalConfigMapList) {
                                            angular.forEach(Object.getOwnPropertyNames(additionalConfigMapList), function (acprop, acpropKey) {
                                                var getacpropKey = fieldPropertiesMapping[acprop] || acprop;
                                                field[getacpropKey] = additionalConfigMapList[acprop];
                                            });
                                        }
                                    //console.log("111 dd123 defaultValue field additionalConfigMap=", field);
                                        break;
                                    case "dataKeyMap":
                                        var dataKeyMapList = uiFiled["dataKeyMap"];
                                        var dataConfigList = {};
                                        var dataSourceId = uiFiled["dataSourceId"] || 0;
                                        if (dataSourceId > 0) {
                                            var dataUrl = "datasource/" + dataSourceId;
                                            dataConfigList["dataUrl"] = dataUrl;

                                            if (dataKeyMapList) {
                                                angular.forEach(Object.getOwnPropertyNames(dataKeyMapList), function (acprop, acpropKey) {
                                                    var getacpropKey = fieldPropertiesMapping[acprop] || acprop;
                                                    dataConfigList[getacpropKey] = dataKeyMapList[acprop];
                                                });
                                            }
                                            field["dataConfig"] = dataConfigList;
                                            //console.log("dataConfigList=", dataConfigList);
                                        }
                                        break;
                                    //case "fieldTypeCode":
                                    //    var fieldtype = uiFiled["fieldTypeCode"];
                                    //    console.log("fieldtype==", fieldtype);
                                    //    var gridFeatures = {};
                                    //    var returnFeatures = {};
                                    //    if (fieldtype == 'grid') {
                                    //        console.log("GridFieldData", uiFiled);
                                    //        gridFeatures = uiFiled["additionalConfigMap"].features;
                                    //        if (gridFeatures) {
                                    //            angular.forEach(Object.getOwnPropertyNames(gridFeatures), function (acprop, acpropKey) {
                                    //                console.log("acprop=", acprop);
                                    //                console.log("acpropKey=", acpropKey);
                                    //                var getacpropKey = fieldPropertiesMapping[acprop] || acprop;
                                    //                console.log("getacpropKey=", getacpropKey);
                                    //                returnFeatures[getacpropKey] = gridFeatures[acprop];    
                                    //            });
                                    //        }
                                    //        field["gridConfig"] = returnFeatures;
                                    //        console.log("returnFeatures=", returnFeatures);
                                    //        alert("grid");
                                    //    }
                                    //    break;
                                    default:
                                        var getPropKey = fieldPropertiesMapping[propKey] || propKey;
                                        
                                        field[getPropKey] = uiFiled[propKey];
                                        break;
                                }
                            });
                            fields.push(field);
                        });
                        column["fields"] = fields;

                        rowDivision.columns.push(column);
                        //console.log(" 111 each column=", col);
                    });
                    rowDivisions.push(rowDivision);
                });
                return rowDivisions;
            };

            var getGridConfig = function (additionalConfigMap) {
                // console.log("111 modelMap =");
                //dataFormatMapper
                var gridConfig = {};
                gridConfig["columns"] = [];

                if (additionalConfigMap && additionalConfigMap["features"]) {
                    additionalConfigMap["features"]["overlayLoadingTemplate"] = '<span class="ag-overlay-loading-center">Please wait while your rows are loading</span>';

                    gridConfig["features"] = additionalConfigMap["features"];
                } else {
                    gridConfig["features"] = {
                        "enableGridMenu": false,
                        "floatingFilter": false,
                        "enableFilter": true,
                        "enableSorting": true,
                        "toolPanelSuppressRowGroups": true,
                        "enableColResize": true,
                        "alignedGrids": [],

                        "overlayLoadingTemplate": '<span class="ag-overlay-loading-center">Please wait while your rows are loading</span>'
                    };
                }
                return gridConfig;
            };

            var getFiledStyleConfig = function (field, uifield) {
                var inlineStyles = "";
                var styleConfig = uifield["styleConfigMap"] || undefined;
                if (styleConfig) {
                    field["cssClass"] = styleConfig["cssClass"] || "";
                    var inlineStyleList = styleConfig["styles"] || {};
                    if (Object.getOwnPropertyNames(inlineStyleList).length > 0) {
                        angular.forEach(inlineStyleList, function (prop, propKey) {
                            inlineStyles += " " + propKey + ":" + inlineStyleList[propKey] + ";";
                        });
                        field["style"] = inlineStyles;
                    }
                }
                return field;
            };

            var getSections = function (uiFileds) {
                var sections = alasql("SELECT * FROM ?  GROUP BY sectionNo ORDER BY sectionNo ASC", [uiFileds]);
                // console.log("111 Sections list -->", sections);
                return sections;
            };
            var getSectionStyle = function (sectionsStyles, sectionNo) {
                var sectionStyle = {};
                if (sectionsStyles && sectionsStyles.sections && sectionsStyles.sections.length > 0) {
                    sectionStyle = alasql("SELECT * FROM ?  WHERE sectionNo=? ", [sectionsStyles.sections, sectionNo]);
                    //console.log("111 Style sectionStyle -->", sectionStyle);
                }
                if (sectionStyle.length > 0)
                    sectionStyle = sectionStyle[0];
                sectionStyle = getInlineStyles(sectionStyle);
                return sectionStyle;
            }

            var getRowStyle = function (sectionsStyles, sectionNo, rowNo) {
                var rowStyle = {};
                if (sectionsStyles && sectionsStyles.sections && sectionsStyles.rows.length > 0) {
                    var rowStyle = alasql("SELECT * FROM ?  WHERE sectionNo=? AND rowNo=? ", [sectionsStyles.rows, sectionNo, rowNo]);
                   // console.log("111 Style rowStyle -->", rowStyle);
                }
                if (rowStyle.length > 0)
                    rowStyle = rowStyle[0];
                rowStyle = getInlineStyles(rowStyle);
                return rowStyle;
            }
            var getColumnStyle = function (sectionsStyles, sectionNo, rowNo, columnNo) {
                var colStyle = {};
                var colStyleFromRowSection ="";
                var rowStyle = getRowStyle(sectionsStyles, sectionNo, rowNo);
                var columnStyleFromRowSection = rowStyle["columnCssClass"];
                if (columnStyleFromRowSection) {

                    // console.log("keys=",Object.getOwnPropertyNames(columnStyleFromRowSection));
                    var colStylesInRowSection = columnStyleFromRowSection[Object.getOwnPropertyNames(columnStyleFromRowSection)[0]];
                    //console.log("keys1 =", colStylesInRowSection);
                    if (contains(colStylesInRowSection, columnNo)) {
                        colStyleFromRowSection = Object.getOwnPropertyNames(columnStyleFromRowSection)[0];
                    }
                    //console.log("colStyle colStyleFromRowSection=",colStyleFromRowSection);
                    //return colStyle;
                } 

                    if (sectionsStyles.sections && sectionsStyles.columns.length > 0) {
                        var colStyle = alasql("SELECT * FROM ?  WHERE sectionNo=? AND rowNo=? AND columnNo =? ", [sectionsStyles.columns, sectionNo, rowNo, columnNo]);
                       // console.log("111 Style rowStyle -->", colStyle);
                    }
                    if (colStyle.length > 0){
                       // console.log("colStyle 111=",colStyle[0]);
                        colStyle["cssClass"] =   colStyle[0]["cssClass"];
                    }
                    colStyle["cssClass"] =   colStyle["cssClass"] +" "+colStyleFromRowSection;
                    colStyle = getInlineStyles(colStyle);

                    //console.log("colStyle=",colStyle);
                    return colStyle;
              
            }
            //concate inline styles
            var getInlineStyles = function (styleObj) {
                var inlineStyles = "";
                var inlineStyleList = styleObj["styles"] || {};
                if (Object.getOwnPropertyNames(inlineStyleList).length > 0) {
                    angular.forEach(inlineStyleList, function (prop, propKey) {
                        inlineStyles += " " + propKey + ":" + inlineStyleList[propKey] + ";";
                    });
                    styleObj["inline_style"] = inlineStyles;
                }
                return styleObj;
            }

            var contains = function (a, obj) {
                var i = a.length;
                while (i--) {
                    if (a[i] === obj) {
                        return true;
                    }
                }
                return false;
            }


            var getRows = function (uiFileds, sectionNo) {
                var rows = [];
               // console.log("111 sectionNo=", sectionNo);
                if (sectionNo) {
                    rows = alasql("SELECT * FROM ? WHERE sectionNo=? GROUP BY rowNo ", [uiFileds, sectionNo]);
                } else {
                    rows = alasql("SELECT * FROM ? GROUP BY rowNo ", [uiFileds]);
                }

                var rowsOrder = alasql("SELECT * FROM ? ORDER BY rowNo ", [rows]);
               // console.log("111 sectionNo--> rows list -->", rowsOrder);
                return rowsOrder;
            };
            var getColumns = function (uiFileds, sectionNo, rowNo) {
                var columns = alasql("SELECT DISTINCT columnNo FROM ? WHERE sectionNo=? and rowNo=? ORDER BY columnNo ", [uiFileds, sectionNo, rowNo]);
                //console.log("111 sectionNo,rowNo-->columns list -->", sectionNo, rowNo, columns);
                return columns;
            };

            var getFields = function (uiFileds, sectionNo, rowNo, colNo) {
                var columns = alasql("SELECT * FROM ? WHERE sectionNo=? and rowNo=? and columnNo=? ORDER BY columnNo ", [uiFileds, sectionNo, rowNo, colNo]);
                //console.log("111 sectionNo,rowNo-->columns list -->", sectionNo, rowNo, columns);
                return columns;
            };

            this.loadCurrentScreenMetaData = function (callback) {
                menuDefinitionService.getActiveMenuMetadata().then(function (currentMenuDef) {
                    if (!currentMenuDef || currentMenuDef["screenConfig"]) {
                      //  return;
                    }

                    var screenConfig = currentMenuDef["screenConfig"] || undefined;
                    if (screenConfig) {
                        if (angular.isFunction(callback)) {
                            callback(screenConfig);
                        }
                    }
                    else {
                        var currentTenantCode = tenantService.getCurrentTenantCode();
                        //var authToken = localPersistenceService.get("authToken", true);

                        //TODO: this metadata should be based on logged in user authToken
                        var configDataUrl = getScreenConfigUrl();
                        console.log("configDataUrl", configDataUrl);
                        $http.get(configDataUrl)
                            .success(function (screenConfig) {
                                var screenDef = extendWithDefaultConfig(screenConfig, currentMenuDef["pattern"]);
                               // console.log('screenConfig', screenConfig);
                                if (isCache()) {
                                    //var menuKey = menuDefinitionService.getActiveMenuKey();
                                    menuDefinitionService.updateCurrentMenuMetadata("screenConfig", screenDef);
                                }

                                if (angular.isFunction(callback)) {
                                    callback(screenDef);
                                }

                            });
                    }
                });


            };

        }]);

    return angularAMD;
});