define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.service('localPersistenceService', ['$rootScope', '$http', '$q', '$state', '$filter',
        function ($rootScope, $http, $q, $state, $filter) {
            var globalStore = localStorage;
            var sessionStore = sessionStorage;

            var serializer = angular.toJson;
            var deserializer = angular.fromJson;

            this.setSerializer = function (s) {
                if (typeof s !== 'function') {
                    throw new TypeError('[localPersistenceService] - setSerializer expects a function.');
                }

                serializer = s;
            };

            this.setDeserializer = function (d) {
                if (typeof d !== 'function') {
                    throw new TypeError('[localPersistenceService] - setDeserializer expects a function.');
                }

                deserializer = d;
            };

            this.get = function (key, fromGlobal) {
                var store = fromGlobal ? globalStore : sessionStore;
                var data = store.getItem(key);
                if (data) {
                    try {
                        data = deserializer(data);
                    } catch (e) {

                    }
                    
                }
                return data;
            }
            this.set = function (key, value, toGlobal) {
                var store = toGlobal ? globalStore : sessionStore;
                var data = value;
                if (!angular.isString(value) && angular.isObject(value)) {
                    data = serializer(value);
                }
                store.setItem(key, data);
                this[key] = data;
            }
            this.remove = function (key, fromGlobal) {
                var store = !fromGlobal ? globalStore : sessionStore;
                store.removeItem(key);
            }

            this.clear = function () {
                sessionStore.clear();
            }
        }]);

    return angularAMD;
});