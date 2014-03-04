"use strict";

var deps = [];

try
{
    //Check if ngStorage is available
    angular.module('testIfNgStorageIsAvailable').requires.push('ngStorage');
    deps.push('ngStorage');
}
catch(e){}

angular.module('ngSymbiosis.repository', deps)
    .factory('BaseRepository', function ($q, $http, $injector) {

        var localStorage;

        var idParameter = 'id';

        function BaseRepository(data) {
            if (!data.name) {
                throw new Error('You must specify a name');
            }

            this.$settings = {
                name: data.name,
                model: data.model
            };

            if($injector.has('$localStorage')) {
                localStorage = $injector.get('$localStorage');
                localStorage[data.name + 'Repository.cache'] = localStorage[data.name + 'Repository.cache'] || {};
                this.cache = localStorage[data.name + 'Repository.cache'];
            }
            else
            {
                this.cache = {};
            }

        }

        BaseRepository.prototype.getById = function (id) {
            var repository = this;
            var Model = repository.$settings.model;

            var deferred = $q.defer();
            var instance = repository.cache[id];
            if (instance) {

                if(!(instance instanceof Model)) {
                    instance = repository.cache[id] = new Model(repository.cache[id]);
                }

                deferred.resolve(instance);
                return deferred.promise;
            }
            else {
                return $http.get(Model.$settings.url + '/' + id, {tracker: repository.$settings.name + '.getById'}).then(function (response) {
                    var instance = new Model(response.data);
                    repository.cache[id] = instance;
                    return instance;
                });
            }
        };

        BaseRepository.prototype.getAll = function () {
            var repository = this;
            var Model = repository.$settings.model;

            //TODO: Max length of pool, to not manage to many instances in memory?
            return $http.get(Model.$settings.url, {tracker: repository.$settings.name + '.getAll'}).then(function (response) {
                if (angular.isArray(response.data)) {
                    return response.data.map(function (item) {
                        var instance = new Model(item);
                        repository.cache[item[idParameter]] = instance;
                        return instance;
                    });
                }
                else {
                    throw new Error('Unexpected response from API. Expected Array, got ' + typeof response.data, response.data);
                }
            });
        };

        //This is to attach new models to the Repository
        BaseRepository.prototype.attach = function (item) {
            var repository = this;
            var Model = repository.$settings.model;

            if (!(item instanceof Model)) throw new Error('You must provide a valid ' + repository.$settings.name + 'Model');

            if(repository.cache[item[idParameter]]) {
                angular.copy(item, repository.cache[item[idParameter]]);
            }
            else
            {
                repository.cache[item[idParameter]] = item;
            }
        };

        BaseRepository.prototype.create = function (data) {
            var repository = this;
            var Model = repository.$settings.model;

            return new Model(data);
        };

        return BaseRepository;
    });