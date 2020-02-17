define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.constant('stepperConfig', {
        stepSize: 1,
        min: 0,
        max: 100
    }).directive('numericStepper', ['stepperConfig',
  function (stepperConfig) {
      'use strict';
      return {
          restrict: 'A',
          require: 'ngModel',
          scope: {
              'value': "=ngModel",
              'ngRequired': "=ngRequired"
          },
          replace: true,
          templateUrl: 'engines/angularjs/components/jsonbasedpages/directive/form/views/stepper.html',
          link: function (scope, element, attrs, ngModelController) {
             // scope.value = 0;
              // Set default values
              attrs.min = parseInt(attrs.min || stepperConfig.min, 10);
              attrs.max = parseInt(attrs.max || stepperConfig.max, 10);
              attrs.value = parseInt(attrs.value || stepperConfig.value, 10);
              attrs.stepSize = parseInt(attrs.stepSize || stepperConfig.stepSize, 10);
              attrs.allowCycle = attrs.allowCycle || false;
              scope.attrs = angular.copy(attrs);
              var input = element.find('input');


              // when model change, cast to integer
              ngModelController.$formatters.push(function (value) {
                  return parseInt(value, 10) || 0;
              });

              // when view change, cast to integer
              ngModelController.$parsers.push(function (value) {
                  return parseInt(value, 10) || 0;
              });

              ngModelController.$render = function () {
                  console.warn("RENDER", ngModelController.$viewValue, input[0].value);
                  input[0].value = ngModelController.$viewValue;
              };

              scope.$watch('value', function (newValue, oldValue, scope) {
                  checkValidity();
              });

              scope.onChange = function () {
                  ngModelController.$setViewValue(+input[0].value || 0);
                  ngModelController.$render();
                  checkValidity();
              };

              scope.isOverMin = function () {
                  var disabled = !ngModelController.$valid ||
                    scope.attrs.allowCycle || (+ngModelController.$viewValue === scope.attrs.min);

                  return disabled;
              };
              scope.isOverMax = function () {
                  var disabled = !ngModelController.$valid ||
                    scope.attrs.allowCycle || (+ngModelController.$viewValue === scope.attrs.max);

                  return disabled;
              };

              scope.increment = function () {
                  var val = +ngModelController.$viewValue
                    , updateFn = scope.attrs.allowCycle ? loop : clamp;

                  input[0].focus();
                  ngModelController.$setViewValue(updateFn(val + scope.attrs.stepSize, scope.attrs.min, scope.attrs.max));
                  ngModelController.$render();


              };

              scope.decrement = function () {
                  var val = +ngModelController.$viewValue
                    , updateFn = scope.attrs.allowCycle ? loop : clamp;

                  ngModelController.$setViewValue(updateFn(val - scope.attrs.stepSize, scope.attrs.min, scope.attrs.max));
                  ngModelController.$render();
                  checkValidity();
              };

              function loop(val, min, max) {
                  return val < min ? max : (val > max ? min : val);
              }

              function clamp(val, min, max) {
                  return val < min ? min : (val > max ? max : val);
              }

              function checkValidity() {
                  var isValid;
                  isValid = ngModelController.$viewValue >= scope.attrs.min && +ngModelController.$viewValue <= scope.attrs.max;
                  ngModelController.$setValidity('outOfBounds', isValid);
              }


              function onKeyDown(evt) {
                  //if (!ngModelController.$valid) {
                  //    return;
                  //}
                  var key = evt.charCode || evt.keyCode || 0;
                  if (key === 38) {
                      scope.increment();
                  }
                  if (key === 40) {
                      scope.decrement();
                  }
                  scope.$apply();
                  console.log(key);
              }

              input.bind('keydown', onKeyDown);

              checkValidity();

          }
      };
  }
    ]);
    return angularAMD;
});