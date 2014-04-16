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
    .service('time',function () {
        this.now = function () {
            return new Date().getTime();
        }
    })
    .factory('BaseRepository', function ($q, $http, $injector, time) {
        var localStorage;

        function BaseRepository(data) {
            if (!data.name) {
                throw new Error('You must specify a name');
            }

            var defaults = {
                trackBy: 'id', //id field
                cachetime: 60, //default number of seconds to cache object
                localStorage: {
                    cacheNamespace: data.name + 'Repository.cache',
                    metadataNamespace: data.name + 'Repository.metadata'
                }
            };

            this.$settings = angular.extend(defaults, data);

            if($injector.has('$localStorage')) {
                localStorage = $injector.get('$localStorage');

                var cacheNS = this.$settings.localStorage.cacheNamespace, metadataNS = this.$settings.localStorage.metadataNamespace;

                localStorage[cacheNS] = localStorage[cacheNS] || {};
                this.cache = localStorage[cacheNS];

                localStorage[metadataNS] = localStorage[metadataNS] || {};
                this.metadata = localStorage[metadataNS];
            }
            else
            {
                this.cache = {};
                this.metadata = {};
            }

        }

        BaseRepository.prototype.getById = function (id) {
            var repository = this;
            var Model = repository.$settings.model;

            var deferred = $q.defer();
            var wasCached = !!repository.cache[id];

            var instance = repository.cache[id] = repository.cache[id] || new Model();

            var useCache = wasCached && repository.metadata && repository.metadata[id] && typeof repository.metadata[id].updatedAt == 'number' && (repository.metadata[id].updatedAt - repository.$settings.cachetime) < time.now();

            repository.metadata[id] = repository.metadata[id] || {};

            if (useCache) {
                deferred.resolve( instance );
                return angular.extend(deferred.promise, {$value: instance});
            }
            else {
              var promise = $http.get(Model.$settings.url + '/' + id, {tracker: repository.$settings.name + '.getById'}).then(function (response) {
                instance.$set(response.data);
                repository.cache[id] = instance;
                repository.metadata[id].updatedAt = time.now();
                return instance;
              });

              return angular.extend(promise, {$value:instance});
            }
        };

        BaseRepository.prototype.getAll = function () {
            var repository = this;
            var Model = repository.$settings.model;

            var promise = $http.get(Model.$settings.url, {tracker: repository.$settings.name + '.getAll'}).then(function (response) {
              if (angular.isArray(response.data)) {
                return response.data.map(function (item) {
                  var instance = new Model(item);

                  var idParam = repository.$settings.trackBy;

                  repository.cache[item[idParam]] = instance;
                  repository.metadata[item[idParam]] = {
                    updatedAt: time.now()
                  };

                  return instance;
                });
              }
              else {
                throw new Error('Unexpected response from API. Expected Array, got ' + typeof response.data, response.data);
              }
            });

            return angular.extend(promise, {$value: repository.cache});
        };

        //This is to attach new models to the Repository
        BaseRepository.prototype.attach = function (item, metadata) {
            var repository = this;
            var Model = repository.$settings.model;
            var idParam = repository.$settings.trackBy;

            if (!(item instanceof Model)) throw new Error('You must provide a valid ' + repository.$settings.name + 'Model');

            //Do not lose reference to original object
            if(repository.cache[item[idParam]]) {
                angular.copy(item, repository.cache[item[idParam]]);
                angular.copy(metadata, repository.metadata[item[idParam]]);
            }
            else
            {
                repository.cache[item[idParam]] = item;
                repository.metadata[item[idParam]] = metadata || {};
            }
        };

        BaseRepository.prototype.create = function (data) {
            var repository = this;
            var Model = repository.$settings.model;

            return new Model(data);
        };

        return BaseRepository;
    });