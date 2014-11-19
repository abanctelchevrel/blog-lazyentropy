---
layout: post
title:  "Mocked API in an Angular app : $httpBackend"
date:   2014-11-14 08:53:57
categories: jekyll update
---

Expliquer les différences entre [ngMockE2E.$httpBackend](https://docs.angularjs.org/api/ngMockE2E/service/$httpBackend) et [ngMock.$httpBackend](https://docs.angularjs.org/api/ngMock/service/$httpBackend).

Monter l'exemple d'une directive qui récupère de la donnée du serveur et qui l'affiche. La donnée de test est hardcodée dans la directive, alors qu'en vrai cette donnée est récupérée du serveur.

Montrer comment déplacer la données hardcodée dans le httpBackend. 

Expliquer avantage, comme ajouter une latence "real world".

Montrer d'abord un exemple simple (récupération d'une liste d'items via un GET sur /items). Puis des exemples plus compliqués (POST, GET sur /items/:id ...)
#### The problem
Say you're implementing a directive that fetch a frien list from a server and displays it. In such situation it's recommended to test your code with fake data, for tweaking the UI or to test edge cases, and you end up with code like that :

{% highlight js %}
//friend-list.js
myApp.directive('friendList', function () {
  return {
    templateUrl: 'views/template/friend-list.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      var devMode = true;
      if (devMode) {
        // Below is the hardcoded fake data that help you test during development : 
        scope.friendList = [{
          name: "Antoine",
          status: "Cooking",
          id: 1
        }, {
          name: "David",
          status: "Idle...",
          id: 2
        }];
      } else {
        $http.get('/friends').then(function(response) {
          scope.friendList = response.data;
        });
      }
    }
  };
});

{% endhighlight %}


{% highlight html %}
{% raw %}
<!-- views/template/friend-list.html -->
<div class="list-group">
  <a ng-href="/#/friends/{{friend.id}}" class="list-group-item" ng-repeat="friend in friendList">
    <h4 class="list-group-item-heading">{{friend.name}}</h4>
    <p class="list-group-item-text">{{friend.status}}</p>
  </a>
</div>
{% endraw %}
{% endhighlight %}

See the ``` if (devMode) { ... }``` part ? It's here for development purpose.
When you're finished you'll have to remember to switch ``` var devMode = false ```, or comment it out. And it will stay here, polluting your directive's code. Wouldn'it be great to have a unique place where to handle all your "stubb" data that you use only for development purpose ?

#### Meet ngMockE2E.$httpBackend

Angular has a nice ways to do just that : the ```$httpBackend```service. It takes advantage of the neat dependency injection structure of the library by proxying all Ajax calls made with ```$http```. This way you can catch an API call before it's actually made, and pass it a fake response. Let's see how it works.

First you have to add the ngMock source code to your app.

*   download it : `bower install angular-mocks`
*   add it to your page :
{% highlight html %}
{% raw %}
<!-- index.html -->

<script src="bower_components/angular/angular.js"></script>
<script src="bower_components/angular-mocks/angular-mocks.js"></script>
...
{% endraw %}
{% endhighlight %}

#### Handle a simple `GET /items request

In this case we want the fake backend to respond a list of friends when a `GET /friends` request is made

{% highlight js %}
//app.js
myApp.run(function ($httpBackend) {
  // Below line is to pass request for view templates.
  $httpBackend.whenGET(/views\/.*/).passThrough();
  // When a get is made on an url matching the regex ... 
  $httpBackend.whenGET(/friends/)
    // ... respond with this data;
    .respond([{
      name: 'Antoine',
      status: 'Cooking',
      id: 1
    }, {
      name: 'David',
      status: 'Idle...',
      id: 2
    }]);

});
{% endhighlight %}

For convenience we store the data in a external service.

{% highlight js %}
//app.js
myApp.run(function ($httpBackend, mockGetAllFriends) {
  $httpBackend.whenGET(/views\/.*/).passThrough();
  $httpBackend.whenGET(/friends$/)
    .respond(mockGetAllFriends.get());
}).factory('mockGetAllFriends', function () {
  var results = [{
    name: 'Antoine',
    status: 'Cooking',
    id: 1
  }, {
    name: 'David',
    status: 'Idle...',
    id: 2
  }];

  // Public API here
  return {
    get: function() {
      return results;
    }
  };
});
{% endhighlight %}

Given that all your Ajax call are made through the ```$http``` service.

#### Handle "GET /items/:id" request

Now we want the fake backend to respond a single friend when a `GET /friends/:id` request is made.

You have to teach the fake backend a new rule : 

{% highlight js %}
//app.js
myApp.run(function ($httpBackend, mockGetAllFriends, mockGetAFriend) {
  $httpBackend.whenGET(/views\/.*/).passThrough();
  $httpBackend.whenGET(/friends$/)
    .respond(mockGetAllFriends.get());
  $httpBackend.whenGET(/friends\/\w+$/)
    .respond(function(method, url) {
      // Retrieve the asked id as integer ...
      var re = /.*\/friends\/(\w+)/;
      var id = parseInt(url.replace(re, '$1'), 10);
      // ... and search it in the friend list.
      var existingFriend = mockGetAFriend.get(id);
      if (existingFriend) {
        // The asked id exists in the friend list.
        return [200, existingFriend];
      } else {
        // The asked id does not exist : 404 NOT FOUND
        return [404]; 
      }
    });
}).factory('mockGetAFriend', function (mockGetAllFriends) {
  return {
    get: function(friendId) {
      //Use underscore.js findWhere to find user with requested id.
      var existingFriend = _.findWhere(mockGetAllFriends.get(), {
        id: friendId
      });
      return existingFriend;
    }
  };
}).factory('mockGetAllFriends', function () {
  var results = [{
    name: 'Antoine',
    status: 'Cooking',
    id: 1
  }, {
    name: 'David',
    status: 'Idle...',
    id: 2
  }];

  // Public API here
  return {
    get: function() {
      return results;
    }
  };
});
{% endhighlight %}
