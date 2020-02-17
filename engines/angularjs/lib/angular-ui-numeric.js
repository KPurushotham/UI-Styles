define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.constant('stepperConfig', {
        stepSize: 10,
        min: 0,
        max: 100
    }).directive('uiStepper', ['stepperConfig',
  function (stepperConfig) {
      'use strict';
      return {
          restrict: 'A',
          require: 'ngModel',
          scope: {
              'value': "=ngModel"
          },
          replace: true,
          templateUrl: 'stepper.html',
          link: function (scope, element, attrs, ngModelController) {

              // Set default values
              attrs.min = parseInt(attrs.min || stepperConfig.min, 10);
              attrs.max = parseInt(attrs.max || stepperConfig.max, 10);
              attrs.value = parseInt(attrs.value || stepperConfig.value, 10);
              attrs.stepSize = parseInt(attrs.stepSize || stepperConfig.stepSize, 10);
              attrs.allowCycle = attrs.allowCycle || false;

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
                    attrs.allowCycle || (+ngModelController.$viewValue === attrs.min);

                  return disabled;
              };
              scope.isOverMax = function () {
                  var disabled = !ngModelController.$valid ||
                    attrs.allowCycle || (+ngModelController.$viewValue === attrs.max);

                  return disabled;
              };

              scope.increment = function () {
                  var val = +ngModelController.$viewValue
                    , updateFn = attrs.allowCycle ? loop : clamp;

                  input[0].focus();
                  ngModelController.$setViewValue(updateFn(val + attrs.stepSize, attrs.min, attrs.max));
                  ngModelController.$render();


              };

              scope.decrement = function () {
                  var val = +ngModelController.$viewValue
                    , updateFn = attrs.allowCycle ? loop : clamp;

                  ngModelController.$setViewValue(updateFn(val - attrs.stepSize, attrs.min, attrs.max));
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
                  isValid = ngModelController.$viewValue >= attrs.min && +ngModelController.$viewValue <= attrs.max;
                  ngModelController.$setValidity('outOfBounds', isValid);
              }


              function onKeyDown(evt) {
                  if (!ngModelController.$valid) {
                      return;
                  }
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