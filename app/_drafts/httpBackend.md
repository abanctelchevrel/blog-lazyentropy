---
layout: post
title:  "Mocked API in an Angular app : $httpBackend"
date:   2014-11-14 08:53:57
categories: jekyll update
---

Expliquer les différences entre [ngMockE2E.$httpBackend](https://docs.angularjs.org/api/ngMockE2E/service/$httpBackend) et [ngMock.$httpBackend](https://docs.angularjs.org/api/ngMock/service/$httpBackend).

Monter l'exemple d'une directive qui récupère de la donnée du serveur et qui l'affiche. La donnée de test est hardcodée dans la directive, alors qu'en vrai cette donnée est récupérée du serveur.

Montrer comment déplacer la données hardcodée dans le httpBackend. 

Montrer d'abord un exemple simple (récupération d'une liste d'items via un GET sur /items). Puis des exemples plus compliqués (POST, GET sur /items/:id ...)
{% highlight js %}
  //friend-list.js
  myApp.directive('friendList', function () {
    return {
      templateUrl: 'views/template/friend-list.html',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        scope.friendList = [{
            name: "Antoine",
            status: "Cooking",
            id: 1
        }, {
            name: "David",
            status: "Idle...",
            id: 2
        }];
      }
    };
  });
{% endhighlight %}


{% highlight html %}
<!-- views/template/friend-list.html -->
<div class="list-group">
  <a ng-href="/#/friends/{{friend.id}}" class="list-group-item" ng-repeat="friend in friendList">
    <h4 class="list-group-item-heading">{{friend.name}}</h4>
    <p class="list-group-item-text">{{friend.status}}</p>
  </a>
</div>
{% endhighlight %}


