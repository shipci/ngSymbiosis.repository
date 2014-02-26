AngularJS repository [![Build Status](https://travis-ci.org/ngSymbiosis/ngSymbiosis.repository.png?branch=master)](https://travis-ci.org/ngSymbiosis/ngSymbiosis.repository)
=======

Angular ORM that uses [ngSymbiosis model](https://github.com/ngSymbiosis/ngSymbiosis.model) to handle interactions with data sources. It handles caching to local storage. 

`bower install ng-symbiosis-repository`

# Usage (TODO: :))
Check [ngSymbiosis model](https://github.com/ngSymbiosis/ngSymbiosis.model) for now

```javascript
angular.module('yourApp')
    .factory('CategoryRepository', function ($injector, CategoryModel) {
        var BaseRepository = $injector.get('BaseRepository');
        return new BaseRepository({name: 'Category', model: CategoryModel});
    });
```
