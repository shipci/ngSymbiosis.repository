"use strict";

describe('ng-symbiosis-repository', function () {

    var BaseRepository, $httpBackend, BaseModel, $rootScope, $localStorage, currentTime, time;

    beforeEach(function () {
        currentTime = 0;

        BaseModel = function (p) {
            this.id = p.id;
            this.title = p.title;
        };

        BaseModel.$settings = {
            url: 'URL'
        };

        $localStorage = {};

        time = {
            now: function () {
                return currentTime;
            }
        };

        module('ngSymbiosis.repository', function ($provide) {
            $provide.value('$localStorage', $localStorage)
            $provide.value('time', time)
        });

        inject(function (_BaseRepository_, _$httpBackend_, _$rootScope_) {
            BaseRepository = new _BaseRepository_({
                name: 'Test',
                model: BaseModel
            });
            $httpBackend = _$httpBackend_;
            $rootScope = _$rootScope_;
        });

    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('getById', function () {
        it('should return models by id', function () {
            $httpBackend.expectGET(BaseModel.$settings.url + '/5').respond(200, {id: 5, title: 'Base title'});

            var promise = BaseRepository.getById(5);

            var response;
            promise.then(function (r) {
                response = r;
            });

            $httpBackend.flush();

            expect(response instanceof BaseModel).toBe(true);
        });

        it('should not do subsequent calls if model is cached', function () {
            $httpBackend.expectGET(BaseModel.$settings.url + '/5').respond(200, {id: 5, title: 'Base title'});
            BaseRepository.getById(5);
            $httpBackend.flush();

            var promise = BaseRepository.getById(5);

            var response;
            promise.then(function (r) {
                response = r;
            });

            $rootScope.$digest();

            expect(response instanceof BaseModel).toBe(true);
        });

        it('should handle rejects', function () {
            $httpBackend.expectGET(BaseModel.$settings.url + '/5').respond(404, 'No such thang!');

            var promise = BaseRepository.getById(5),
                response,
                success = jasmine.createSpy('success'),
                error = jasmine.createSpy('error');

            promise.then(success).catch(error);

            $httpBackend.flush();

            expect(success).not.toHaveBeenCalled();
            expect(error).toHaveBeenCalled();
        });
    });

    describe('getAll', function () {
        it('should return models by id', function () {
            $httpBackend.expectGET(BaseModel.$settings.url).respond(200, [
                {id: 5, title: 'Base title'},
                {id: 6, title: 'Base title'}
            ]);

            var promise = BaseRepository.getAll();

            var Base5, Base6;
            promise.then(function (r) {
                Base5 = r[0];
                Base6 = r[1];
            });

            $httpBackend.flush();

            expect(Base5 instanceof BaseModel).toBe(true);
            expect(Base6 instanceof BaseModel).toBe(true);
        });

        it('should handle rejects', function () {
            $httpBackend.expectGET(BaseModel.$settings.url).respond(404, 'No such thang!');

            var promise = BaseRepository.getAll(5),
                success = jasmine.createSpy('success'),
                error = jasmine.createSpy('error');

            promise.then(success).catch(error);

            $httpBackend.flush();

            expect(success).not.toHaveBeenCalled();
            expect(error).toHaveBeenCalled();
        });
    });

    describe('attach', function () {

        it('should throw if trying to attach a model that is not of valid type', function () {
            function wrapper() {
                BaseRepository.attach({fails: true});
            }

            expect(wrapper).toThrow();
        });

        it('should return the attached model on subsequent requests', function () {
            currentTime = 0;
            BaseRepository.attach(new BaseModel({id: 5, title: 'Base title'}), {updatedAt: 0});

            var Base;

            BaseRepository.getById(5).then(function (response) {
                Base = response;
            });

            $rootScope.$digest();

            expect(Base instanceof BaseModel).toBe(true);
        });
    });

    describe('create', function () {
        it('should return a newed up instance of the Base Model', function () {
            var Base = BaseRepository.create({title: 'New title'});
            expect(Base instanceof BaseModel).toBe(true);
        });
    });

    describe('cache', function () {
        it('should return the cached data', function () {
            currentTime = 0;
            var newBase = {id: 19, title: 'Yeah!'};
            BaseRepository.cache[19] = newBase;
            BaseRepository.metadata[19] = {updatedAt: 0};

            var Base;
            BaseRepository.getById(19).then(function (response) {
                Base = response;
            });
            $rootScope.$digest();

            expect(Base instanceof BaseModel).toBe(true);
            expect(Base).toEqual(newBase);
        });

        it('should return the cached instance', function () {
            currentTime = 0;
            var newBase = new BaseModel({id: 19, title: 'Yeah!'});
            BaseRepository.cache[19] = newBase;
            BaseRepository.metadata[19] = {updatedAt: 0};

            var Base;
            BaseRepository.getById(19).then(function (response) {
                Base = response;
            });
            $rootScope.$digest();

            expect(Base instanceof BaseModel).toBe(true);
            expect(Base).toBe(newBase);
        });

        it('should save cache to localStorage', function() {
            expect(BaseRepository.cache).toBe($localStorage['TestRepository.cache']);
        });

    });

    describe('saveChanges', function () {
        it('should save all changes in current Repository to the server');
    });
});