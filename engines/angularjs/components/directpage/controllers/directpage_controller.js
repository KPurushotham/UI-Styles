define(['app', 'stateService', 'httpService', 'ngSanitize', 'dateUtilService', 'pdfjsViewer', 'tenantService'], function () {
    'use strict';
    return ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$location', '$http',
        '$httpParamSerializer', 'overlay', 'httpService', 'stateService', 'localPersistenceService',
        'utilService', 'Notification', 'tenantConstants', '$sce', 'dateUtilService', 'tenantService',
        function ($scope, $rootScope, $state, $stateParams, $timeout, $location, $http, $httpParamSerializer,
            overlay, httpService, stateService, localPersistenceService, utilService, Notification, tenantConstants, $sce, dateUtilService, $window, tenantService) {
            $scope.message = 'Welcome to Home Page';
            $scope.statusValues;
            var self = this;
            this.resultSet = {};
            $scope.$on('$viewContentLoaded', function (event) {
            });
            self = this;
            this.buildPage = function (datasets) {
                var resultSet = datasets[0];
                for (var i = 0; i < datasets.length; i++) {
                    resultSet = datasets[i];
                    if (resultSet.recipientTypeCode === "TO") {
                        self.resultSet = resultSet;
                        break;
                    }
                }
                console.log("res=", self.resultSet);

                var status = self.resultSet.actionCode || self.resultSet.campaignItemActionStatusCode;

                if ($scope.statusValues[1] === "AUTOACCEPT" && status === "PENDING") {
                    $scope.updateStatus("ACCEPTED");
                }
                else {
                    self.displayInvoiceActionOrDetails(status);
                }

                var pdfPath = self.resultSet.emailData["attach_file"] + "&directAccessToken=" + self.resultSet.directAccessToken;

                $http.get(pdfPath, {
                    responseType: 'arraybuffer'
                }).then(function (response) {
                    $scope.pdfData = new Uint8Array(response.data);
                });
            };

            this.displayInvoiceActionOrDetails = function (status) {
                var data = self.resultSet;
                $scope.showActions = (status === 'PENDING');
                if (!$scope.showActions) {
                    var actionDateTime = data.actionDateTime;
                    //  var date = (dateUtilService.convertToDateTimeFormat(actionDateTime)).format(DATE_FORMAT)
                    if (actionDateTime) {
                        $scope.actionTimeDate = dateUtilService.convertToDateTimeFormat(actionDateTime);
                    }
                    else {
                        $scope.actionTimeDate = dateUtilService.getCurrentDateTime("MM/DD/YYYY hh:mm:ss");
                    }
                    console.log("$scope.actionTimeDate:  ", $scope.actionTimeDate);
                    $scope.status = status;
                    $scope.comments = data.comments || $scope.txtComments;
                    $scope.actionDoneBy = data.actionDoneBy || data.recipientEmailId;
                }
            };

            $scope.updateStatus = function (status, tenantId) {
                console.log("status", status);

                if ((status === "REJECTED" && $scope.txtComments !== undefined) || status === "ACCEPTED") {
                    var comments = $scope.txtComments;
                    var inVoiceNum = self.resultSet.campaignItemApplicationObjectId;
                    self.applicationId = self.resultSet.applicationId;

                    var clientName = self.resultSet.clientName;
                    var senderName = self.resultSet.senderName;
                    var emailSubject = buildEmailSubjectBasedOnStatus(inVoiceNum, status, clientName, senderName, self.applicationId);
                    //"Invoice : " + inVoiceNum + " has been " + status + " by " + clientName + " : " + senderName;

                    var params = {
                        "applicationId": self.resultSet.applicationId,
                        "campaignItemApplicationObjectId": self.resultSet.campaignItemApplicationObjectId,
                        "directAccessToken": self.resultSet.directAccessToken,
                        "campaignItemId": self.resultSet.campaignItemId,
                        "statusCode": status,
                        "comments": comments,
                        "actionDoneBy": self.resultSet.recipientEmailId,
                        "isActive": "t",
                        "tenantId": self.resultSet.tenantId,
                        "emailSubject": emailSubject
                    };
                    console.log("in updateStatus params=", params);

                    overlay.load();
                    //var url = "public/email/campaign/item/action/save";
                    var url = 'RestProxy.php?servicecode=INVOICE_ACTION_SAVE';
                    $.ajax({
                        type: "POST",
                        beforeSend: function (request) {
                            request.setRequestHeader("X-TenantId", self.resultSet.tenantId);
                        },
                        url: url,
                        data: params,
                        success: function (results) {
                            overlay.hide();
                            console.log("results", results);
                            results = results ? JSON.parse(results) : {};
                            var message = "";
                            if (results.success === true || results.success === 'true'
                                || (results.data && results.data.success === true)) {

                                message = buildNotificationMessage(status, true);
                                Notification.success({
                                    message: message, delay: 5000
                                });
                                self.displayInvoiceActionOrDetails(status);

                            }
                            else {
                                message = buildNotificationMessage(status, true);
                                Notification.error({
                                    message: message, delay: 3000
                                });
                            }
                        }
                    });
                }
                else {
                    swal({
                        text: "Please provide comments in order to Reject the contract!",
                        icon: "info",
                        button: "Okay"
                    });
                }
                
            };

            var buildEmailSubjectBasedOnStatus = function (inVoiceNum, status, clientName, senderName, applicationId) {
                var message = "";
                switch (applicationId) {
                    case 1000:
                        var contractType = self.resultSet.emailData.contractType;
                        message = senderName + " / " + clientName + " (" + contractType + " Contract has been " + status +")";
                        break;
                    case 1006:
                        message = "Invoice : " + inVoiceNum + " has been " + status + " by " + clientName + " : " + senderName;
                        break;
                    default:
                        break;
                }
                return message;
            };

            var buildNotificationMessage = function (status, isSuccess) {
                var message = "";
                switch (self.applicationId) {
                    case 1000:
                        if (isSuccess) {
                            message = 'Contract has been ' + (status === 'ACCEPTED' ? 'accepted' : 'rejected') + ' successfully.';
                        }
                        else {
                            message = 'Failed to ' + (status === 'ACCEPTED' ? 'accept' : 'reject') + ' the contract.';
                        }
                        break;
                    case 1006:
                        if (isSuccess) {
                            message = 'Invoice has been ' + (status === 'ACCEPTED' ? 'accepted' : 'rejected') + ' successfully.';
                        }
                        else {
                            message = 'Failed to ' + (status === 'ACCEPTED' ? 'accept' : 'reject') + ' the invoice.';
                        }
                        break;
                    default:
                        break;
                }
                return message;
            };

            var init = function () {
                //var url = "public/email/campaign/item/preview/access/" + $stateParams.id + "?recipientEmailId=" + new Date().getMilliseconds() + "@gmail.com";// + email;
                var url = 'RestProxy.php?servicecode=INVOICE_ACCESS&accesscode=' + $stateParams.id;
                var statusFromUrl = window.location.search.substring(1);
                $scope.statusValues = statusFromUrl.split("=");
                overlay.load();
                $.getJSON(url, function (data, status, jqXHR) {
                    overlay.hide();
                    if (data.success === "true" && data.dataset && data.dataset.length > 0) {
                        console.log("angualr based direct page with results: ", data);
                        self.buildPage(data.dataset);
                        $scope.showMainContent = true;
                        $scope.showInvalidToken = false;
                    }
                    else {
                        console.log("angualr based direct page with no results");
                        $scope.showMainContent = false;
                        $scope.showInvalidToken = true;
                        //Notification.error({ message: 'Invalid Access Token', delay: 3000 });
                    }


                });
            };

            init();

        }];
});
