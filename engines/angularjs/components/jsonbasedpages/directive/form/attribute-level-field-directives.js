define(['angularAMD', 'platform-main-module', 'dateUtilService', 'common', 'alasql'], function (angularAMD, dateUtilService) {
    'use strict';
    var app = angular.module('platform-main-module');

    app.directive('tabindex', function () {
        return {
            restrict: 'A',
            link: function (scope, elem, attr, ctrl) {
                if (attr.tabindex == 1) {
                    elem.focus();
                }
            }
        };
    });
    app.directive('numbersOnly', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function fromUser(text) {
                    if (text) {
                        var transformedInput = text.replace(/[^0-9]/g, '');
                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    return '';
                }
                ngModelCtrl.$parsers.push(fromUser);
            }
        };
    });

    app.directive('blurToCurrency', function ($filter) {
        return {
            require: 'ngModel',

            link: function (scope, el, attrs, ngModelCtrl) {
                var uVal = '';
                el.val($filter('IndianCurrency')(el.val()));

                el.bind('focus', function () {

                    uVal = $filter('UnFormatCurrency')(el.val());
                    if (isNaN(uVal))
                        uVal = '';
                    el.val(uVal);
                });

                el.bind('input', function () {
                    //    el.val(el.val());
                    scope.$apply();
                });

                el.bind('blur', function () {
                    el.val($filter('IndianCurrency')(el.val()));
                });
            }
        }
    });
    app.directive('blurToUnitCurrency', function ($filter) {
        return {
            require: 'ngModel',

            link: function (scope, el, attrs, ngModelCtrl) {
                var uVal = '';
                el.val($filter('IndianCurrency')(el.val(), 4));

                el.bind('focus', function () {

                    uVal = $filter('UnFormatCurrency')(el.val());
                    if (isNaN(uVal))
                        uVal = '';
                    el.val(uVal);
                });

                el.bind('input', function () {
                    //    el.val(el.val());
                    scope.$apply();
                });

                el.bind('blur', function () {
                    el.val($filter('IndianCurrency')(el.val(), 4));
                });
            }
        }
    });
    app.directive('excludingZero', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function filterData(text) {
                    if (text) {

                        if (parseInt(text) == 0) {
                            ngModelCtrl.$setViewValue('');
                            ngModelCtrl.$render();
                        }
                        var transformedInput = text.replace(/[^0-9]/g, '');
                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    return '';
                }
                ngModelCtrl.$parsers.push(filterData);
            }
        };
    });

    app.directive('checkSpecial', function ($rootScope) {
        return {
            require: '?ngModel',
            link: function (scope, element, attrs, ngModelCtrl) {
                if (!ngModelCtrl) {
                    return;
                }

                ngModelCtrl.$parsers.push(function (val) {
                    if (angular.isUndefined(val)) {
                        var val = '';
                    }

                    //var clean = val.replace(/[^0-9\.]/g, '');
                    var clean = val.replace(/[^0-9A-Za-z]/g, '');
                    var negativeCheck = clean.split('-');
                    var decimalCheck = clean.split('.');
                    if (!angular.isUndefined(negativeCheck[1])) {
                        negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                        clean = negativeCheck[0] + '-' + negativeCheck[1];
                        if (negativeCheck[0].length > 0) {
                            clean = negativeCheck[0];
                        }

                    }

                    if (!angular.isUndefined(decimalCheck[1])) {
                        var dRound = 2;
                        if ($rootScope.UserData.round_decimals != undefined)
                            dRound = parseInt($rootScope.UserData.round_decimals);
                        decimalCheck[1] = decimalCheck[1].slice(0, dRound);
                        clean = decimalCheck[0] + '.' + decimalCheck[1];
                    }

                    if (val !== clean) {
                        ngModelCtrl.$setViewValue(clean);
                        ngModelCtrl.$render();
                    }
                    return clean;
                });
                element.bind('keypress', function (event) {
                    if (event.keyCode === 32) {
                        event.preventDefault();
                    }
                });
            }
        };
    });
    app.directive('onlyLettersInput', onlyLettersInput);
    function onlyLettersInput() {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function filterData(text) {
                    var transformedInput = text.replace(/[^a-zA-Z]/g, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                ngModelCtrl.$parsers.push(filterData);
            }
        };
    };
    app.directive('dateInputChars', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function filterData(text) {
                    if (text) {
                        var transformedInput = text.replace(/[^0-9/-]/g, '');

                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    return undefined;
                }
                ngModelCtrl.$parsers.push(filterData);
            }
        };
    });
    app.directive('tooltip', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $('[data-toggle="tooltip"]').tooltip('destroy');
                $(element).hover(function () {
                    //$(element).tooltip('hide');
                    console.log(element[0].offsetWidth + "=" + element[0].scrollWidth);
                    // on mouseenter
                    if (element[0].offsetWidth < element[0].scrollWidth) {
                        //console.log(element);
                        //console.log(element[0].offsetWidth+"="+element[0].scrollWidth);
                        $(element).tooltip('show');
                    }
                }, function () {
                    // on mouseleave
                    //$(element).tooltip('hide');
                    // $('[data-toggle="tooltip"]').tooltip('destroy');
                });
            }
        };
    });
    app.directive('validDecimal', function () {
        return {
            require: '?ngModel',
            link: function (scope, element, attrs, ngModelCtrl) {
                if (!ngModelCtrl) {
                    return;
                }

                ngModelCtrl.$parsers.push(function (val) {
                    if (angular.isUndefined(val)) {
                        var val = '';
                    }

                    var clean = val.replace(/[^0-9\.]/g, '');
                    var negativeCheck = clean.split('-');
                    var decimalCheck = clean.split('.');
                    if (!angular.isUndefined(negativeCheck[1])) {
                        negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                        clean = negativeCheck[0] + '-' + negativeCheck[1];
                        if (negativeCheck[0].length > 0) {
                            clean = negativeCheck[0];
                        }

                    }

                    if (!angular.isUndefined(decimalCheck[1])) {
                        decimalCheck[1] = decimalCheck[1].slice(0, 2);
                        clean = decimalCheck[0] + '.' + decimalCheck[1];
                    }

                    if (val !== clean) {
                        ngModelCtrl.$setViewValue(clean);
                        ngModelCtrl.$render();
                    }
                    return clean;
                });

                element.bind('keypress', function (event) {
                    if (event.keyCode === 32) {
                        event.preventDefault();
                    }
                });
            }
        };
    });
    app.directive('quantityDecimal', function () {
        return {
            require: '?ngModel',
            link: function (scope, element, attrs, ngModelCtrl) {
                if (!ngModelCtrl) {
                    return;
                }

                ngModelCtrl.$parsers.push(function (val) {
                    if (angular.isUndefined(val)) {
                        var val = '';
                    }

                    var clean = val.replace(/[^0-9\.]/g, '');
                    var negativeCheck = clean.split('-');
                    var decimalCheck = clean.split('.');
                    if (!angular.isUndefined(negativeCheck[1])) {
                        negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                        clean = negativeCheck[0] + '-' + negativeCheck[1];
                        if (negativeCheck[0].length > 0) {
                            clean = negativeCheck[0];
                        }

                    }

                    if (!angular.isUndefined(decimalCheck[1])) {
                        decimalCheck[1] = decimalCheck[1].slice(0, 4);
                        clean = decimalCheck[0] + '.' + decimalCheck[1];
                    }

                    if (val !== clean) {
                        ngModelCtrl.$setViewValue(clean);
                        ngModelCtrl.$render();
                    }
                    return clean;
                });

                element.bind('keypress', function (event) {
                    if (event.keyCode === 32) {
                        event.preventDefault();
                    }
                });
            }
        };
    });
    app.filter('capitalizeFirstLetter', function () {
        return function (string) {

            if (string != null && string.length > 0)
                return string.charAt(0).toUpperCase() + string.slice(1);
            else
                return '';
        };
    });
    app.filter('IndianCurrency', function () {
        return function (data, n = 2) {

            if (null != data) {
                return Number(data).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: n, maximumFractionDigits: n });
            } else {
                return Number(0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: n, maximumFractionDigits: n });
            }
        };
    });
    app.filter('UnFormatCurrency', function () {
        return function (price) {
            price = price.toString();
            return parseFloat(price.replace(/[^0-9-.]/g, ''));
        };
    });
    
    return angularAMD;
});