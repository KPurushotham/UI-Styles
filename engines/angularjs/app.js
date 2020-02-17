define(['platform-main-module', 'common', 'notify', 'stateService', 'angularCSS', 'ngMaterial', 'appDefinitionService',
    'localPersistenceService', 'menuDefinitionService', 'alaSqlExtensions', 'overlay', 'ngSanitize', 'ngMdIcons','dateUtilService','utilService'], function (angularAMD, ngSanitize) {
        'use strict';
        console.log("I am in app");

        agGrid.initialiseAgGridWithAngular1(angular);

        var app = angular.module('platform-main-module');

        app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', 'stateServiceProvider', 'dashboardConfig',
            function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, stateServiceProvider, dashboardConfig) {

                $httpProvider.interceptors.push(function ($q, $location) {
                    return {
                        response: function (response) {

                            return response;
                        },
                        responseError: function (response) {

                            if (response.status === 401)
                                // $location.url('/auth/login');
                                return $q.reject(response);
                        }
                    };
                });
                $locationProvider.html5Mode(true);
                console.log("getAccessToken***");
                //  $urlRouterProvider.otherwise('/auth/login');

                //loads default states
                stateServiceProvider.loadDefaultStates();


            }]);

        app.run(['$rootScope', '$location', 'stateService', '$q', '$timeout',
            'idsSideMenuService', 'menuDefinitionService', 'authService',
            function ($rootScope, $location, stateService, $q, $timeout, idsSideMenuService, menuDefinitionService, authService) {
                console.log("I am in app.run1");
                $q.all().then(function () {
                    $rootScope.$pageFinishedLoading = true;
                    console.log('$q.all()', $rootScope.$pageFinishedLoading);
                });

                $timeout(function () {
                    if (!$rootScope.$pageFinishedLoading) {
                        $rootScope.$pageFinishedLoading = true;
                        console.log('$timeout', $rootScope.$pageFinishedLoading);
                    }
                }, 7000);

                $rootScope.$idsSideMenuService = idsSideMenuService;
                authService.validateAccessToken().then(function (isValidToken) {
                    menuDefinitionService.loadCurrentAppMenusStates().then(function (data) {
                        console.log("call--22", data);
                    });
                });
                //TODO : Implement Error Page State
                console.log("call-loadCurrentAppMenusStates");
                //menuDefinitionService.loadMenusMetadata();


            }
        ]);
        app.run(function ($http, $state, $location, $rootScope, overlay, localPersistenceService, dateUtilService, utilService) {
            var activeStateKey = localPersistenceService.get("activeStateKey", true);
            $rootScope.$tenantLogPath = localPersistenceService.get("tenantLogPath", true);
         //   $rootScope.$tenantLogPath = localStorage.getItem("tenantLogPath", true);   
            console.log('activeStateKey', activeStateKey);
            $rootScope.$on('$stateChangeStart'
                , function (event, toState, toParams, fromState, fromParams) {
                    // session timeout Check
                     utilService.sessionTimeOutCheck();
                    angular.forEach($http.pendingRequests, function (pendingRequest, index) {
                        console.log('pendingRequest', pendingRequest);
                        
                    });
                    console.log('$stateChangeStart 1', event);
                    console.log('$stateChangeStart 2', toState);
                    console.log('$stateChangeStart 3', toParams);
                    console.log('$stateChangeStart 4', fromState);
                    console.log('$stateChangeStart 5', fromParams);
                });

            $rootScope.$on("$locationChangeSuccess", function (event, next, current) {
                //overlay.hide();
            });
        });

        app.filter('unsafe', function ($sce) { return $sce.trustAsHtml; });

        app.factory('srv', function ($q, $http) {
            var queue = [];
            var execNext = function () {
                var task = queue[0];
                $http(task.c).then(function (data) {
                    queue.shift();

                    data.counter = task.counter;

                    task.d.resolve(data);
                    if (queue.length > 0) execNext();
                }, function (err) {
                    task.d.reject(err);
                })
                    ;
            };
            return function (config, counter) {
                var d = $q.defer();

                queue.push({ c: config, d: d, counter: counter });
                if (queue.length === 1) execNext();
                return d.promise;
            };
        });

        app.config(function (ngMdIconServiceProvider) {
            ngMdIconServiceProvider.addShapes({
                'icon-nested-select-vbar': '<path d="M 19.5 0h1v40h-1z"/>',
                'icon-nested-select-el': '<path d="M 19.5 0h1v19.5h19.5v1h-20.5z"/>',
                'icon-nested-select-midbar': '<path d="M 19.5 0h1v19.5h19.5v1h-19.5v39h-1z"/>',
                'icon-nested-select-space': '<g/>',
            }).addViewBoxes({
                'icon-nested-select-vbar': '0 0 40 40',
                'icon-nested-select-el': '0 0 40 40',
                'icon-nested-select-midbar': '0 0 40 40',
                'icon-nested-select-space': '0 0 40 40'
            });
        }).component('nestedSelect', {
            bindings: {
                options: '<',
                label: '@',
                onChange: '&'
            },
            templateUrl: './engines/angularjs/components/jsonbasedpages/directive/dropdown/views/nestedSelect.html',
            controller: function nestedSelect($scope, $timeout, $element, $attrs, $mdConstant, $sce) {
                //$controller('fieldBaseController', { $scope: $scope });
                var $ctrl = this;
                $ctrl.attrs = $attrs;
                // Lifecycle event handlers
                $scope.$parent.field.childScope = $scope;

                $scope.$parent.field.getModel = function (forViewModel) {
                    // console.log(" *** child getModel", forViewModel);
                    return this.childScope.$ctrl.getSelectionValues();
                };

                $scope.$parent.field.setDefaultValue = function () {
                    //alert("aaa");
                    return this.childScope.$ctrl.setDefaultSelection();
                };

                $scope.$parent.field.setModel = function (value, key) {
                    // console.log(" *** child getModel", forViewModel);
                    return this.childScope.$ctrl.setSelectionValues(value);
                };

                $ctrl.setSelectionValues = function (values) { 
                    
                    angular.forEach(values, function (value) {
                        $ctrl.applyFnToOptions(function accumulateSelectedValues(opt) {
                            //console.log("nested opt---", opt);
                            if (opt["children"] && opt["children"].length > 0) {
                                opt.selected = false;
                                angular.forEach(opt["children"], function (copt) {
                                    if (copt.value === value) {
                                        copt.selected = true;
                                        console.log("child nested opt ---",copt, copt.selected);
                                    }
                                });
                            }
                            else if (opt.parentDataSourceId === undefined) {
                                if (opt.value === value) {
                                    opt.selected = true;
                                    console.log("parent nested opt---",opt, opt.selected);
                                }
                            }
                            //if (opt.value === value) {
                            //    if (opt["children"] && opt["children"].length > 0) {
                            //        opt.selected = false;
                            //    }
                            //    else {
                            //        opt.selected = true;
                            //    }                                
                            //    console.log("nested opt---", opt, opt.selected);
                            //}
                        });
                    });                    
                    
                };

                $ctrl.$onInit = function () {

                    // console.log("dd123=",$scope,$sce);

                    $ctrl.filter = "";
                    $ctrl.placeholder = $attrs.placeholder;
                    $ctrl.multiple = !!$attrs.$attr.multiple;
                    $ctrl.collapsible = !!$attrs.$attr.collapsible;
                    $ctrl.showSelection = !!$attrs.$attr.showSelection;
                    $ctrl.allowSelectAll = !!$attrs.$attr.allowSelectAll;
                    $ctrl.fixedMenu = !!$attrs.$attr.fixedMenu;
                    $ctrl.isLoaded = false;
                    $ctrl.showSelectAll = $attrs.showSelectAll
                    //console.log("dd123 $ctrl.defaultSelection=", $attrs.defaultvalue, $attrs);
                   // console.log("dd123 $ctrl.attrs.isLoaded=", $ctrl.isLoaded, $attrs.isloaded);

                    // $ctrl.defaultSelection = $attrs.defaultValue;
                   // console.log("dd123 $ctrl.defaultSelection=", $ctrl.defaultSelection);
                    $element.on("focusout", $ctrl.onFocusout);
                    $element.on("keyup", $ctrl.onKeyup);
                };

                $ctrl.$onChanges = function (changes) {
                    //console.log("dd123=", $scope);
                  // console.log("aaaaa=", changes);
                    if (changes.options) {
                        $ctrl.options = angular.copy($ctrl.options);
                    } else {
                        $ctrl.options = $ctrl.options || [];
                    }
                    //$ctrl.isLoaded =true ;
                    //$ctrl.isLoaded = $ctrl.attrs.isloaded === "true" ? true : false;
                    console.log("95055 $ctrl.attrs.isLoaded=", $ctrl.attrs.isloaded);
                    console.log("95055 $ctrl.attrs.isLoaded=", $ctrl);
                    $ctrl.updateHighlightedOptions();

                   
                    setTimeout(function(){ 
                        $ctrl.setDefaultSelection($ctrl.defaultSelection);
                     }  , 1000);
                };

                $ctrl.$postLink = function () {
                    var menu = $element.find('nested-select-menu');
                    if (menu) {
                        var width = $element[0].clientWidth;
                        width = (width === 0) ? 190 : width;

                        //menu.css('width', $element[0].clientWidth + 'px');
                    }
                };

                // UI event handlers

                $ctrl.onFocusout = function (event) {
                    // Because the component includes multiple focusable
                    // elements, this handler can be triggered when the
                    // user moves from one element to another within
                    // the main container. That's not really a focusout
                    // event for the whole component, so we want to
                    // ignore those interactions.
                    if ($element[0].contains(event.relatedTarget)) {
                        return;
                    }

                    $ctrl.closeMenu();

                    // Angular doesn't automatically run a digest if
                    // the event's target is outside of the component
                    // element. This occurs, for example, if the
                    // user clicks outside the element.
                    $scope.$apply();
                };

                $ctrl.onKeyup = function (event) {
                    switch (event.keyCode) {
                        case $mdConstant.KEY_CODE.ESCAPE:
                            $ctrl.closeMenu();
                            document.activeElement.blur();
                            $scope.$apply();
                            break;
                        case $mdConstant.KEY_CODE.RIGHT_ARROW:
                        case $mdConstant.KEY_CODE.DOWN_ARROW:
                            $ctrl.navigateForward();
                            break;
                        case $mdConstant.KEY_CODE.LEFT_ARROW:
                        case $mdConstant.KEY_CODE.UP_ARROW:
                            $ctrl.navigateBackward();
                            break;
                    }
                };

                $ctrl.onClickSelection = function () {
                    $ctrl.toggleMenu();
                };

                $ctrl.onChangeFilter = function () {
                    //console.log("dd123 onChangeFilter=");
                    $ctrl.updateHighlights();
                    $ctrl.updateHighlightedOptions();
                   // console.log("dd123 onChangeFilter options=", $ctrl.options);
                };
                 

                $ctrl.setDefaultSelection = function () {
                    //console.log("setDefaultSelection=",$ctrl);
                    var defaultvalue = $ctrl.attrs["defaultvalue"];
                    var defautModel = [];
                    if (!angular.isArray(defaultvalue)) {
                        defautModel = [defaultvalue];
                    } else {
                        if (defaultvalue)
                            defautModel = defaultvalue;
                    }
                    if (defautModel.length > 0) {
                        // console.log("dd123 setDefaultSelection=", $ctrl.attrs, defautModel);
                        $ctrl.applyFnToOptions(function selectOption(opt) {
                            if (!opt.suppressed && !opt.muted) {
                                if (defautModel.indexOf(opt.value) !== -1) {
                                    $ctrl.selectOption(opt, true);
                                    //hasChanged = true;
                                } else {
                                    $ctrl.deselectOption(opt, true);
                                }
                            }
                        }, $ctrl.options, true);
                    }
                    else {
                        var selectedIndex = $ctrl.attrs["defaultselectedindex"];
                        $ctrl.selectOption($ctrl.options[selectedIndex], true);
                    }
                };

                $ctrl.onClickAll = function () {

                    // Don't emit change events for
                    // each change but rather keep track
                    // of all changes and emit a single event
                    // after all options have been processed.
                    var hasChanged = false;

                    // If all the visible options are already
                    // selected, this event de-selects them.
                    if ($ctrl.isSelectionComplete()) {
                        $ctrl.applyFnToOptions(function deselectOption(opt) {
                            if (!opt.suppressed && !opt.muted) {
                                $ctrl.deselectOption(opt, true);
                                hasChanged = true;
                            }
                        }, $ctrl.options, true);
                    } else {
                        $ctrl.applyFnToOptions(function selectOption(opt) {
                            if (!opt.suppressed && !opt.muted) {
                                $ctrl.selectOption(opt, true);
                                hasChanged = true;
                            }
                        }, $ctrl.options, true);
                    }

                    // If any options were updated, inform
                    // the parent controller that the 
                    // selection set has changed.
                    if (hasChanged) {
                        $ctrl.emitChange();
                    }
                };

                // Child component event handlers

                $ctrl.onOptionChange = function (event) {
                    //console.log("dd123 onOptionChange=", event);
                    if (!$ctrl.multiple) {
                        if (event.option.selected) {
                            $ctrl.applyFnToOptions(function (opt) {
                                if (opt !== event.option) {
                                    $ctrl.deselectOption(opt, true);
                                }
                            });
                            var selection = $element.find('nested-select-selection');
                            if (selection.length) {
                                $ctrl.setFocus(selection[0]);
                            }
                        } else {
                            $ctrl.clearFocus();
                        }
                        $ctrl.closeMenu();
                    }
                    $ctrl.emitChange();
                };

                // Emit events to parent components

                $ctrl.emitChange = function () {
                    $ctrl.onChange({ $event: { selectedValues: $ctrl.getSelectionValues() } });
                };

                // Utility functions

                $ctrl.applyFnToOptions = function (fn, opts, excludeCollapsed) {
                    opts = opts || $ctrl.options;
                    angular.forEach(opts, function applyFnToOption(opt) {
                        fn(opt);
                        if (opt.children && (!opt.collapsed || !excludeCollapsed)) {
                            $ctrl.applyFnToOptions(fn, opt.children, excludeCollapsed);
                        }
                    });
                };

                $ctrl.isSelectionComplete = function () {
                    var all = true;
                    $ctrl.applyFnToOptions(function checkOptionSelectedState(opt) {
                        all = all && (opt.selected || opt.suppressed || opt.muted);
                    }, $ctrl.options, true);
                    return all;
                };

                $ctrl.getSelectionText = function () {
                    var selection = [];
                    $ctrl.applyFnToOptions(function accumulateSelectedText(opt) {
                        if (opt.selected) {
                            selection.push(opt.text);
                        }
                    });
                    var selectedText = selection.join(", ");
                    $ctrl.SelectedText = selectedText;
                    $scope.$parent.field["SelectedText"] = selectedText;
                    return selectedText;
                };
                $scope.$parent.field.getSelectionValues = function () {
                    var selection = [];
                    $ctrl.applyFnToOptions(function accumulateSelectedValues(opt) {
                        if (opt.selected) {
                            selection.push(opt);
                        }
                    });
                    return selection;
                };

                $ctrl.getSelectionValues = function () {
                    var selection = [];
                    $ctrl.applyFnToOptions(function accumulateSelectedValues(opt) {
                        if (opt.selected) {
                            selection.push(opt);
                        }
                    });
                    return selection;
                };

                $ctrl.hasValue = function () {
                    var hasValue = false;
                    $ctrl.applyFnToOptions(function accumulateSelectedValues(opt) {
                        if (opt.selected) {
                            hasValue = true;
                        }
                    });
                    return hasValue;
                };

                $ctrl.hasFocus = function () {
                    return $element[0].contains(document.activeElement);
                };

                $ctrl.setFocus = function (element, delay) {
                    delay = delay || 0;
                    // Because the controller is already watching for
                    // focus events on the entire component, make sure
                    // that Angular doesn't run the digest loop here.
                    // Otherwise Angular throws an already in progress
                    // error.
                    // See https://docs.angularjs.org/error/$rootScope/inprog
                    $timeout(function () {
                        element.focus();
                    }, delay, false);
                };

                $ctrl.clearFocus = function () {
                    // Because the controller is already watching for
                    // focusout events on the entire component, make sure
                    // that Angular doesn't run the digest loop here.
                    // Otherwise Angular throws an already in progress
                    // error.
                    // See https://docs.angularjs.org/error/$rootScope/inprog
                    $timeout(function () {
                        document.activeElement.blur();
                    }, 0, false);
                };

                $ctrl.getFocusableNodes = function () {
                    var nodes = Array.prototype.slice.call($element[0].querySelectorAll([
                        "nested-select-selection",
                        "input",
                        "button",
                        "md-checkbox"
                    ].join(",")));

                    var hidden = new Set($element[0].querySelectorAll([
                        ".filtering button",
                        "md-checkbox[disabled]",
                        "nested-select-options.collapsed button",
                        "nested-select-options.collapsed md-checkbox"
                    ].join(",")));

                    return nodes.filter(function (node) {
                        return !hidden.has(node);
                    });
                };

                $ctrl.getFocusedIndex = function (nodes) {
                    var curIdx = -1;
                    nodes.some(function (node, idx) {
                        if (node === document.activeElement) {
                            curIdx = idx;
                            return true;
                        }
                    });
                    return curIdx;
                };

                // Component logic

                $ctrl.toggleMenu = function () {
                    if ($ctrl.showMenu) {
                        $ctrl.closeMenu();
                    } else {
                        $ctrl.openMenu();
                    }
                };

                $ctrl.openMenu = function () {
                    $ctrl.showMenu = true;
                    var search = $element.find('input');
                    if (search.length) {
                        $ctrl.setFocus(search[0], 400);
                    }
                };

                $ctrl.closeMenu = function () {
                    $ctrl.showMenu = $ctrl.fixedMenu;
                };

                $ctrl.updateHighlights = function () {

                    var filter = $ctrl.filter;

                    if (filter) {

                        // Convert the text input from the search element
                        // into a regular expression to support features
                        // such as case-insensitivity and match highlighting.
                        // Since the ultimate result is a regular expression,
                        // also give users the ability to enter their own
                        // regular expressions directly. User-entered regular
                        // expressions start and end with a `/` and have at
                        // least one character between them.

                        if (filter.match(/^\/.+\/$/)) {

                            // Already a regular expression, so just
                            // remove the delimiters.
                            filter = filter.slice(1, -1);

                        } else {

                            // Not a regular expression, so escape any
                            // characters that a regular expression would
                            // view as control characters.
                            filter = filter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

                        }

                        // Add grouping parentheses around the search text
                        // so that matching text can be highlighted.
                        $ctrl.highlights = new RegExp("(" + filter + ")", "gi");

                    } else {

                        $ctrl.highlights = false;

                    }
                };

                $ctrl.applyHighlightsToOptions = function (opts) {

                    // Recurse through the options tree and update
                    // each option's status with respect to highlighting.
                    // An option is fully suppressed if it is not
                    // itself highlighted and has no children that
                    // are highlighted. If an option is not itself
                    // highlighted but has highlighted children, it
                    // is not suppressed but muted.

                    // Returns a boolean indicating whether or
                    // not any of the options at the current level
                    // are highlighted or have highlighted children.
                    return opts.reduce(function accumulateHighlights(anyHighlights, opt) {

                        // Does the current option have any highlighted children?
                        var childHighlights = opt.children && $ctrl.applyHighlightsToOptions(opt.children);

                        // Should the current option itself be highlighted?
                        var isHighlighted = $ctrl.highlights.test(opt.text);
                        // Since regex is global, be sure to reset after test()
                        $ctrl.highlights.lastIndex = 0;

                        // If highlighting is needed, do it; otherwise just
                        // use the plain text.
                        if (isHighlighted) {
                            opt.highlightedText = opt.text.replace($ctrl.highlights, "<b>$1</b>");
                        } else {
                            opt.highlightedText = opt.text;
                        }
                        //console.log("dd123 applyFnToOption accumulateHighlights=", opt.highlightedText)
                        // Update the option status.
                        opt.suppressed = !isHighlighted && !childHighlights;
                        opt.muted = !isHighlighted && childHighlights;

                        // Update accumulating value by logically ORing
                        // the highlight status of the current option and
                        // its children
                        return anyHighlights || isHighlighted || childHighlights;
                    }, false);
                };

                $ctrl.updateHighlightedOptions = function () {
                    if ($ctrl.highlights) {

                        // If there are highlights to apply, do so
                        var options = $ctrl.applyHighlightsToOptions($ctrl.options);
                        //console.log("dd123 options 1===", options, $ctrl.options);
                        $ctrl.options = $ctrl.options;
                    } else {

                        // No highlights to apply so just reset
                        // the option status
                        $ctrl.applyFnToOptions(function (opt) {
                            //console.log("dd123 applyFnToOptions=", opt.text)
                            opt.highlightedText = opt.text;
                            opt.suppressed = false;
                            opt.muted = false;
                        });
                    }
                };

                $ctrl.selectOption = function (opt, suppressChange) {
                    if (!opt.selected) {
                        if (!$ctrl.multiple) {
                            $ctrl.applyFnToOptions(function (opt) {
                                $ctrl.deselectOption(opt, true);
                            });
                            $ctrl.closeMenu();
                        }
                        if (!suppressChange) {
                            $ctrl.emitChange();
                        }
                        opt.selected = true;
                    }
                };

                $ctrl.deselectOption = function (opt, suppressChange) {
                    var changed = opt.selected;
                    opt.selected = false;
                    if (changed && !suppressChange) {
                        $ctrl.emitChange();
                    }
                };

                $ctrl.navigateForward = function () {
                    var nodes = $ctrl.getFocusableNodes();
                    var curIdx = $ctrl.getFocusedIndex(nodes);
                    if (curIdx !== -1 && curIdx < nodes.length - 1) {
                        $ctrl.setFocus(nodes[curIdx + 1]);
                    }
                };

                $ctrl.navigateBackward = function () {
                    var nodes = $ctrl.getFocusableNodes();
                    var curIdx = $ctrl.getFocusedIndex(nodes);
                    if (curIdx > 0) {
                        $ctrl.setFocus(nodes[curIdx - 1]);
                    }
                };
            }
        })

            .component('nestedSelectOptions', {
                bindings: {
                    options: '<',
                    collapsible: '<',
                    multiple: '<',
                    depth: '<',
                    lastSibling: '<',
                    onChange: '&'
                },
                templateUrl: './engines/angularjs/components/jsonbasedpages/directive/dropdown/views/nestedOption.html',
                controller: function nestedSelectOptions($element, $attrs, $sce) {
                    var $ctrl = this;
                    $ctrl.$onInit = function () {
                        // console.log("dd123 sce=", $sce)
                        $ctrl.collapsed = false;
                        $ctrl.lastSibling = $ctrl.lastSibling || "";
                    };
                    $ctrl.$onChanges = function (changes) {
                        console.log("95055 nestedSelectOptions on change=", $sce);

                        //console.log("dd123 changes=", $sce, $ctrl.options);
                        if (changes.options && !changes.options.isFirstChange()) {
                            angular.forEach($ctrl.options, function (idx) {
                               // console.log("dd123 idx=", idx, $ctrl.options[idx].highlightedText)
                               //if( $ctrl.options[idx]){
                                $ctrl.options[idx].highlightedText = $sce.getTrustedHtml($ctrl.options[idx].highlightedText);
                               //}
                            });
                            $ctrl.options = angular.copy($ctrl.options);
                        }
                    };
                    $ctrl.trustAsHtmlText = function (text) {
                        //console.log("dd123 trustAsHtmlText=", text);
                        return $sce.trustAsHtml(text);
                    };

                    // Utilities for adding visual guides and buttons

                    // Should a spacer be added to account for collapse/expand button?			
                    $ctrl.showCollapseSpacer = function (opt) {
                        return $ctrl.collapsible && $ctrl.depth;
                    };

                    // How many guides to insert in front of a text label?
                    $ctrl.countPrefixGuides = function () {
                        // retuns an empty array with the appropriate number of 
                        // elements so that ng-repeat can iterate over it
                        return $ctrl.depth > 0 ? new Array($ctrl.depth - 1) : [];
                    };

                    // What icon should be used at the current guide depth?
                    $ctrl.getPrefixGuideIcon = function (opt, depthIdx) {
                        if ($ctrl.multiple || $ctrl.lastSibling[depthIdx + 1] === '1') {
                            return "icon-nested-select-space";
                        } else {
                            return "icon-nested-select-vbar";
                        }
                    };

                    // Should a guide be added for this option?
                    $ctrl.showGuide = function (opt) {
                        return !$ctrl.showCollapse(opt) && (!$ctrl.multiple && ($ctrl.depth > 0) || $ctrl.collapsible);
                    };


                    // What icon should be used for the current option's guide?
                    $ctrl.getGuideIcon = function (opt) {
                        if ($ctrl.collapsible && (!opt.children || opt.children.length === 0) && ($ctrl.depth === 0 || $ctrl.multiple)) {
                            return "icon-nested-select-space";
                        } else if ($ctrl.options[$ctrl.options.length - 1] === opt) {
                            return "icon-nested-select-el";
                        } else {
                            return "icon-nested-select-midbar";
                        }
                    };

                    // Should the collapse/expand button be included?
                    $ctrl.showCollapse = function (opt) {
                        return $ctrl.collapsible && opt.children && (opt.children.length > 0);
                    };


                    $ctrl.onCheckboxChange = function (opt) {
                         console.log("bbbb onCheckboxChange==", $ctrl.options, opt);
                        var isParent = (opt["parentDataSourceId"]) ? false : true;
                        if (isParent) {
                            $ctrl.unCheckParents(opt);
                            $ctrl.unCheckAllChilds();
                        }
                        $ctrl.onChange({ $event: { option: opt } });
                        $ctrl.isSelected=false;
                        angular.forEach($ctrl.options,function(opt){
                            if(opt.selected){
                                $ctrl.isSelected= true;
                                return;
                            }
                            if(opt.children && opt.children.length >0){
                                angular.forEach(opt.children,function(copt){
                                    if(copt.selected){
                                        $ctrl.isSelected= true;
                                        return;
                                    }
                                });
                            }
                                    
                        });
                        //if ($ctrl.depth === 0) {
                        //    if ($ctrl.isSelected) {
                        //        $($element).parent().parent().parent().removeClass("nested_error");
                        //    } else {
                        //        $($element).parent().parent().parent().addClass("nested_error");
                        //    }
                        //}
                        //else {
                        //    if ($ctrl.isSelected) {
                        //        $($element).parent().parent().parent().parent().parent().removeClass("nested_error");
                        //    } else {
                        //        $($element).parent().parent().parent().parent().parent().addClass("nested_error");
                        //    }
                        //}
                        
                    };

                    $ctrl.onCollapseClick = function (opt) {
                        opt.collapsed = !opt.collapsed;
                    };
                    $ctrl.onChildChange = function (event) {
                        //console.log("onCheckboxChange onChildChange==", $ctrl.options);
                        $ctrl.unCheckAllParents();
                        $ctrl.onChange({ $event: { option: event.option } });
                    };

                    $ctrl.unCheckAllParents = function () {
                        angular.forEach($ctrl.options, function (option) {
                            option.selected = false;
                        });
                    };

                    $ctrl.unCheckParents = function (currentOption) {
                        angular.forEach($ctrl.options, function (option) {
                            if (option.value !== currentOption.value && option) {
                                option.selected = false;
                            }
                            // console.log("onCheckboxChange option=", option);
                        });
                    };

                    $ctrl.unCheckAllChilds = function () {
                        angular.forEach($ctrl.options, function (currentOption) {
                            if (currentOption.children.length > 0) {
                                angular.forEach(currentOption.children, function (cOption) {
                                    cOption.selected = false;
                                    // console.log("onCheckboxChange option=", cOption);
                                });
                            }
                        });
                    };
                }
            });

        return angularAMD.bootstrap(app);
    });
