define(['angularAMD', 'modelUtilService', 'dateUtilService', 'fieldService', 'angularjs-gauge', 'modalPopUpService'], function (angularAMD) {
    'use strict';

    angularAMD.controller('kanbanController', function ($scope, $controller, httpService, overlay, Notification,
        $filter, modelUtilService, dateUtilService, fieldService, $uibModal, modalPopUpService,$sce) {
        $controller('fieldBaseController', { $scope: $scope });
        var $kbscope = $scope;
        $scope.field.toggleClass = [];
        $scope.field.getModel = function () {
            var resultModelValue = $scope.field.containers;
            return resultModelValue;
        };

        $scope.field.setModel = function (data) {
            console.log("kanban Data=", data);
            if (data instanceof Array) {
                $scope.field.containers = data;
            } else {
                $scope.field.containers = [];
            }
            
            console.log(" $scope.field.containers modelDataInfo =", $scope.field.containers)
        };

        $scope.field.ok = function () {
            alert("ok");
        };

        $scope.field.expand = function (item) {
            console.log("this=", item);
            if ($scope.field.toggleClass[item.label.replace(' ', '')]) {
                $scope.field.toggleClass[item.label.replace(' ', '')] = false;
            } else {
                $scope.field.toggleClass[item.label.replace(' ', '')] = true;
            }
        };

        $scope.field.evenHandler = function (sourceField, container) {
            console.log("kanban $scope.field = ", $scope.field);
            console.log("kanban $scope.parentForm = ", $scope.parentForm);
            console.log("sourceField, eventName, dependantModelKeysTobeFilled, event, selectedItem=", sourceField, container);
            var formModalData = {};
            self.initalLoadFlagInContractPeriod = false;
            if (sourceField.modalforms)
                sourceField.modalforms[sourceField.modalformName]["functionalService"] = $scope.parentForm["functionalService"];
            var hasModalForm = sourceField["modalformName"];
            if (hasModalForm) {
                modalPopUpService.openDialog(sourceField.modalforms[sourceField.modalformName], formModalData, this.form, 'md')
                    .then(function (res) {
                        res.popupInstance.rendered.then(function (aa) {

                        });
                    });
            } else {
                $scope.parentForm.functionalService[sourceField["actionCallBackFunction"]](sourceField, container);
            }
        };

        $scope.field.openDialog = function (modalForm, actions) {
            console.log("controller.......", $controller);
            console.log("controller.......", actions);
            console.log("controller.......", modalForm);
            console.log("controller.............controller", $scope.field);

            $uibModal.open(
                {
                    size: 'lg',
                    templateUrl: "myModalContent.html",
                    scope: $kbscope,
                    resolve: {
                        payload: function () {
                            return {
                                msg_body: 'Hello! I am payload msg',
                                title: 'Create New Approval Group ',
                                body_title: 'UiBootstrap.net',
                                modalform: modalForm
                            };
                        }
                    },
                    //template:' <div class="modal-header"> <h3 class="modal-title">Hello</h3></div> <div class="modal-body">    I m a modal!</div><div class="modal-footer">    <button class="btn btn-primary" type="button" ng-click="ok()">OK</button>    <button class="btn btn-warning" type="button" ng-click="cancel()">Cancel</button></div>',
                    controller://$scope.field.get,
                        function ($scope, payload, $uibModalInstance) {
                            console.log("controller.............payload", payload);
                            $scope.datas = payload;
                            $scope.formDataModel = {};
                            $scope.ok = function () {
                                console.log("ok.............ok1", $scope.datas);
                                console.log("ok.............ok1", $kbscope);
                                $kbscope.parentForm.functionalService[payload.modalform["handlerName"]]($kbscope, $scope.datas);
                                $uibModalInstance.close();
                            };

                            $scope.cancel = function () {
                                console.log("cancel.............cancel")
                                $uibModalInstance.dismiss('cancel');
                            };
                        }
                }
            );
        };

        $scope.field.trustAsHtml = function (html) {
            return $sce.trustAsHtml(html);
        };

        $scope.trustAsHtml = function (html) {
            return $sce.trustAsHtml(html);
        };

        $scope.refresh = function () {
            $scope.field.modelValue = Math.random(0, 1);
        };
    });

    return angularAMD;
});