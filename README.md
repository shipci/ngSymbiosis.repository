AngularJS repository [![Build Status](https://travis-ci.org/ngSymbiosis/ngSymbiosis.repository.png?branch=master)](https://travis-ci.org/ngSymbiosis/ngSymbiosis.repository)
=======

Uses [ngSymbiosis model](https://github.com/ngSymbiosis/ngSymbiosis.model) to handle interactions with data sources. 

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

```javascript
//Does a GET to the models base url (/videos/)
VideoRepository.getAll().then(function (videos) {
    $scope.videos = videos;
});

//Does a GET for a specific entity (/videos/1)
VideoRepository.getById(1).then(function (video) {
    $scope.video = video;
});
```

# Extending a repository with custom methods

Example, showing how to add a custom `search` method to a `tags` repository: 
```javascript

angular.module('yourApp')
    .factory('TagRepository', function ($injector, TagModel, $http) {
        var BaseRepository = $injector.get('BaseRepository');
        
        
        function TagRepository() {
            //Call `super`
            BaseRepository.apply(this, arguments);
        }
        //Inherit from BaseRepository
        TagRepository.prototype = Object.create(BaseRepository.prototype);

        //Add custom serach method
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

        //Return a new instance of the repository
        return new TagRepository({name: 'TagRepository', model: TagModel});
    });
    
```

## Usage

```javascript
TagRepository.search('query').then(function (hits) {
    //hits is an array of model instances
    doSomething(hits);
});
```
