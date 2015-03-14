---
layout: post
title:  "A hold button with feedback in Angular"
date:   2014-11-14 08:53:57
categories: blog
---


<script src="//cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.14/angular.js"></script>
<script src="/js/hold-button.js"></script>



## The problem

When was the last time you saw a clean implementation of the "Undo" feature in a web application ? In [this article](http://sachagreif.com/undo/) Sacha Greif made a famous rant about the lost art of undoing things, and urges developer to _give us “undo” back._ 

But he misses a point : undo in a webapp is hard. How do yout rollback an email sending ? _Hint : you can't. Gmail just delays it 30s_ 

To mitigate this problem developers have been building fences (also know as ["Are you sure" modals](https://www.google.fr/search?q=are+you+sure+modal&source=lnms&tbm=isch&sa=X&ei=qJkEVfaQE5TYavCcgdAN&ved=0CAcQ_AUoAQ&biw=1344&bih=743)) around features that have a critical impact, like irreversible deletion.

![Are you sure ?](http://dun4nx4d6jyre.cloudfront.net/assets/do-sure.png "Are you sure ?")
![Type to confirm](http://www.questioningdesigns.com/wp-content/uploads/2014/03/mailchimp-delete-action.png "Type to confirm")

Those modal popup do a good job at preventing you from inadvertendly clicking this "delete" button, but sometime they do a good job at sabotaging the user experience too.

## Here comes the hold button.

The hold button (or long-press button) made a big appearance on the UX stage in the shadow of the rising mobile devices adoption. Hold to copy, hold to expand ... are now natural gesture when using a mobile interface, becoming the mobile equivalent to the right click of your mouse. As mobile slowly increases its take on how people uses software, it is not surprising to see a mobile UI components, like the hold button, [being used in a traditional web environment](http://ux.stackexchange.com/a/50782/17281).


Pros of the hold button are that it's unobstrusive and doesn't take up UI real estate, cons is that the button gives no clues that the long press exist on it. To fix this a long-press button must give you a feedback that something will happen if you hold it long enough.

![Hold button states](http://i.stack.imgur.com/lRTUq.jpg "Hold button states")

I implemented a hold button by writing a little Angular directive, but it's so simple that it could be ported easily in any JS flavor.

## Demo.

<div ng-app="HoldButtonDemo" ng-controller="DemoCtrl">
  <div class="xlarge btn" ng-class="{'danger': !isShortActionDone, 'success': isShortActionDone}" ng-style="holdShortStyle"><button hold-button="onHoldShortStart($event, $promise)" hold-button-delay="400">Hold click me</button></div>
</div>

## The code.

I wanted the API of the directive to respect the following spec: 

- be as simple as possible
- do not assume how the progression will be rendered
- allow to specify the hold delay

After some tries I come across the perfect solution : promises ! [Promises](http://documentup.com/kriskowal/q/) are perfect for representing asynchronous events, and a long press button is by essence asynchronous.

So this is the HTML API of the directive. Mind the `$promise` param passed to `onHoldShortStart`

{% highlight html %}
<div ng-app="HoldButtonDemo" ng-controller="DemoCtrl">
  <div class="xlarge btn" ng-class="{'danger': !isShortActionDone, 'success': isShortActionDone}" ng-style="holdShortStyle">
    <button hold-button="onHoldShortStart($event, $promise)" hold-button-delay="400">Hold click me</button>
  </div>
</div>

{% endhighlight %}


The `onHoldShortStart` function passed to the directive is passed a promise. This promise is resolved if the user hold the click long enough. Else the promise is rejected, and the button comes back to its inital state. In this example the progression is rendered with a 'linear-gradient' used as background-image.

{% highlight js %}
//app.js
angular.module('HoldButtonDemo', ['HoldButton'])
  .controller('DemoCtrl', function($scope) {
    $scope.isShortActionDone = false;

    $scope.onHoldShortStart = function($event, $promise) {
      $promise.then(function(success) {
        //Called if the promise is resolved, ie the button is hold long enough
        $scope.isShortActionDone = !$scope.isShortActionDone;
      }, function(reason) {
        //Called if the promise is rejected, ie the button is not hold long enough
        $scope.holdShortStyle = {
          'background-image': 'inherit'
        }
      }, function(update) {
        //This is the progress function, called multiple times before the promise is 
        // either resolved or rejected.
        $scope.holdShortStyle = {
          //Move the background-image, looking like a progress bar.
          'background-image': 'linear-gradient(to right, #1A1A1A ' + update * 100 + '%, transparent ' + update * 100 + '%)'
        }
      })
    }
  });
{% endhighlight %}


Finally the directive's implementation :

{% highlight js %}
//hold-button.js
angular.module('HoldButton', []).directive('holdButton', function($parse, $q, $interval) {
  return {
    restrict: 'A',
    priority: 10,
    link: function postLink(scope, element, attrs) {
      //The framerate of the progress bar, progression will be evaluated every 5ms.  
      var tickDelay = 10;

      var deferred, stop;
      element.on('mousedown', function($event) {
        var onHoldStart = $parse(attrs.holdButton);
        var holdDelay = attrs.holdButtonDelay ? ($parse(attrs.holdButtonDelay)(scope) || 400) : 400;
        var counter = 0;
        var nbTick = holdDelay / tickDelay;
        deferred = $q.defer();

        // Call the onTick function `nbTick` times every `tickDelay` ms.
        // stop is the stopper function 
        stop = $interval(onTick, tickDelay, nbTick);
        function onTick() {
          counter++;
          deferred.notify((counter + 1) / nbTick);
          // If we reach `nbTick` the resolve the promise
          if (counter === nbTick) {
            deferred.resolve();
          }
        }

        if (typeof onHoldStart == 'function' || false) {
          // The function passed as directive parameter is passed the special parameter `$promise`
          // which is the promise resolved after the hold is completed. 
          onHoldStart(scope, {
            $promise: deferred.promise,
            $event: $event
          });
        }
      });
      element.on('mouseup', function($event) {
        $event.stopPropagation();
        $interval.cancel(stop);
        //At mouseup we reject the defered if it existed. This happens if the hold is not completed. 
        if (deferred) {
          deferred.reject($event);
        }
      })
    }
  };
});
{% endhighlight %}


## Going further.

I slowly felt in love with Promises, and I am starting to use it everywhere. This is an another example of how promise can solve elegantly a UI problem.

Lately I have heard of [Bacon.js](https://baconjs.github.io/), and someone presented it to me as "promises all the things". That is all I need to start reading the Bacon.js doc and start to use it in my projects. I'll try to write a post on it, stay tuned.

