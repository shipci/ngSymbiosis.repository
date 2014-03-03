AngularJS repository [![Build Status](https://travis-ci.org/ngSymbiosis/ngSymbiosis.repository.png?branch=master)](https://travis-ci.org/ngSymbiosis/ngSymbiosis.repository)
=======

Angular ORM that uses [ngSymbiosis model](https://github.com/ngSymbiosis/ngSymbiosis.model) to handle interactions with data sources. It handles caching to local storage. 

`bower install ng-symbiosis-repository`

# Usage
Include `ngSymbiosis.repository` as a dependancy to your application.
Check [ngSymbiosis model](https://github.com/ngSymbiosis/ngSymbiosis.model) for now

```javascript
angular.module('yourApp')
    .factory('CategoryRepository', function ($injector, CategoryModel) {
        var BaseRepository = $injector.get('BaseRepository');
        return new BaseRepository({name: 'Category', model: CategoryModel});
    });
```


# Extending a repository with custom methods

Example, showing how to add a custom `search` method to a `tags` repository: 
```javascript

angular.module('yourApp')
    .factory('TagRepository', function ($injector, TagModel, $http) {
        var BaseRepository = $injector.get('BaseRepository');

        function TagRepository() {
            BaseRepository.apply(this, arguments);
        }
        TagRepository.prototype = Object.create(BaseRepository.prototype);

        TagRepository.prototype.search = function (query) {
            var repository = this;
            var Model = repository.$settings.model;

            return $http.get(Model.$settings.url + '/search?q=' + query, {tracker: repository.$settings.name + '.search'}).then(function (response) {
                if (angular.isArray(response.data)) {
                    return response.data.map(function (item) {
                        var instance = new Model(item);
                        repository.cache[item.id] = instance;
                        return instance;
                    });
                }
                else {
                    throw new Error('Unexpected response from API. Expected Array, got ' + typeof response.data, response.data);
                }
            });
        };

        return new TagRepository({name: 'TagRepository', model: TagModel});
    });
    
```
