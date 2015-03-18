/*global angular:false */
angular.module('HoldButtonDemo', ['HoldButton'])
  .controller('DemoCtrl', function($scope) {
    $scope.isLongActionDone = false;
    $scope.isShortActionDone = false;
    $scope.onHoldLongStart = function($event, $promise) {
      $promise.then(function(success) {
        $scope.isLongActionDone = !$scope.isLongActionDone;
      }, function(reason) {
        $scope.holdLongStyle = {
          'background-image': 'inherit'
        };
      }, function(update) {
        //Move the background-image, looking like a progress bar.
        $scope.holdLongStyle = {
          'background-image': 'linear-gradient(to right, #1A1A1A ' + update * 100 + '%, transparent ' + update * 100 + '%)'
        };
      });
    };
    $scope.onHoldShortStart = function($event, $promise) {
      $promise.then(function(success) {
        $scope.isShortActionDone = !$scope.isShortActionDone;
      }, function(reason) {
        $scope.holdShortStyle = {
          'background-image': 'inherit'
        };
      }, function(update) {
        //Move the background-image, looking like a progress bar.
        $scope.holdShortStyle = {
          'background-image': 'linear-gradient(to right, #1A1A1A ' + update * 100 + '%, transparent ' + update * 100 + '%)'
        };
      });
    };
  });

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
        function onTick() {
          counter++;
          deferred.notify((counter + 1) / nbTick);
          // If we reach `nbTick` the resolve the promise
          if (counter === nbTick) {
            deferred.resolve();
          }
        }
        stop = $interval(onTick, tickDelay, nbTick);

        if (typeof onHoldStart === 'function' || false) {
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
      });
    }
  };
});