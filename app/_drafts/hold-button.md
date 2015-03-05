---
layout: post
title:  "A hold button in Angular"
date:   2014-11-14 08:53:57
categories: blog
---

## The problem

When was the last time you saw a proper implementation of the "Undo" feature in a web application ? In [this article](http://sachagreif.com/undo/) Sacha Greif made a famous rant about the lost art of undoing things, and urges developer to _give us “undo” back._ 

But he misses a point : undo in a webapp is hard. How do yout rollback an email sending (Gmail just delays it 30s) ? 

To mitigate this problem developers have been building fences around features that have a critical impact, like irreversible deletion.

(insérer image http://dun4nx4d6jyre.cloudfront.net/assets/do-sure.png)
(insérer image http://dun4nx4d6jyre.cloudfront.net/assets/mc-undo.png)

Those fences do a good job at preventing mistake, but they do better job at sabotaging the user experience.

Here comes the hold button.

Hold button (or long-press button) made a big appearance on the UX stage in the rise of mobile devices adoption. Hold to copy, hold to expand ... became natural gesture when using a mobile interface. But hey have their place in a web interface too.



<!-- 

This article is aimed at developer that are too lazy to do it, but lacks a better option than confirmation popup _à la Mailchimp_ .


 -->

Lazy users.

{% highlight js %}
//friend-list.js
myApp.directive('friendList', function () {
  return {
    templateUrl: 'views/template/friend-list.html',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      var devMode = true;
      if (devMode) {
        // Below is the hardcoded fake data that help you test 
        // during development : 
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

See the ``` if (devMode) { ... }``` part ? It's here only for development purpose.
When you're finished you'll have to remember to switch ``` var devMode = false ```, or comment it out. And it will stay here, polluting your directive's code. 

__Wouldn't it be great to have a unique place where to handle all your "stubb" data that you use only for development purpose ?__

## Meet [`ngMockE2E.$httpBackend`](https://docs.angularjs.org/api/ngMockE2E/service/$httpBackend)

Angular has a nice and elegant way to do just that : [the ```$httpBackend```service](https://docs.angularjs.org/api/ngMockE2E/service/$httpBackend). It takes advantage of the neat dependency injection structure of the library by proxying all Ajax calls made with ```$http```. __This way you can catch an API call before it's actually made, and pass it a fake response.__ Let's see how it works.

First you have to add the `ngMock` source code to your app.

1.  download it : `bower install angular-mocks`
2.  add it to your page and to your app dependencies:
{% highlight html %}
{% raw %}
<!-- index.html -->

<script src="bower_components/angular/angular.js"></script>
<script src="bower_components/angular-mocks/angular-mocks.js"></script>
...
{% endraw %}
{% endhighlight %}

{% highlight js %}
//app.js
angular.module('myApp', [
  'ngRoute',
  'ngMockE2E' //<-- 
])
{% endhighlight %}

## Handle a simple `GET /items` request

In this case we want the fake backend to respond with a list of friends when a `GET /friends` request is made :

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


## Handle a `GET /items/:id` request

Now we want the fake backend to respond with a single friend when a `GET /friends/:id` request is made, the expected behaviour when using a REST API.

You have to teach the fake backend a new rule that demand a finer control on the mocked response logic. To accomplish this, __instead of just passing an object to the `respond` method we now will pass a function.__ This function must return an array (`[http_code, data]`) and will be called with three arguments :

1.  The HTTP method (GET, POST ...)
2.  The requested url
3.  The request payload

{% highlight js %}
//app.js
myApp.run(function ($httpBackend, mockGetAllFriends, mockGetAFriend) {
  $httpBackend.whenGET(/views\/.*/).passThrough();

  $httpBackend.whenGET(/friends$/)
    .respond(mockGetAllFriends.get());

  // This regex matches GET /friends/:id requests
  $httpBackend.whenGET(/friends\/\w+$/)
    .respond(function(method, url, params) {

      // Retrieve the asked id as integer ...
      var re = /.*\/friends\/(\w+)/;
      var friendId = parseInt(url.replace(re, '$1'), 10);
      // ... and search it in the friend list.
      var existingFriend = mockGetAFriend.get(friendId);
      if (existingFriend) {
        // The asked friendId exists in the friend list.
        return [200, existingFriend];
      } else {
        // The asked friendId does not exist : 404 NOT FOUND
        return [404]; 
      }
    });

}).factory('mockGetAFriend', function (mockGetAllFriends) {
  return {
    get: function(friendId) {
      //I use the convenient findWhere from underscore.js to find
      // user with requested id.
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


## The end


That's it, you have a nice place where to store all your fake data logic. Exclude this file from your build script and never get busy finding and commenting fake data in your codebase again. Your directive and controllers won't see the difference !

__A JSFiddle of the demo is available [here](http://jsfiddle.net/antoinebc/sr5wL02a/).__

__NB__ : Of course it only works if all your Ajax call are made through the ```$http``` service. If a part of your code uses an external library that relies on its own XHR implementation you'll have to find another solution.


