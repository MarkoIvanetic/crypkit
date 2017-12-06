'use strict';

/**
 * @ngdoc function
 * @name crypkitApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the crypkitApp
 */
angular.module('crypkitApp')
  .controller('MainCtrl', function($scope, $http, $q) {
    $scope.auctionData = [];
    // https://api.cryptokitties.co/auctions?offset=0&limit=12&type=sale&status=open&search=gen:3&sorting=cheap&orderBy=current_price&orderDirection=asc
    $scope.form = {};
    $scope.form.search = '';

    $scope.cooldown = ["Fast", "Swift", "Snappy", "Brisk", "Plodding", "Slow", "Sluggish", "Catatonic"];

    $scope.getData = function(link) {
      var deferred = $q.defer();
      $http({
        method: 'GET',
        url: link
      }).then(function successCallback(response) {
        $scope.auctionData = $scope.auctionData.concat($scope.processKittyData(response.data.auctions));
        deferred.resolve();
      });
      return deferred.promise;
    }
    $scope.getLink = function(offset = 0, limit = 100, search = '', sort = 'cheap', order = 'current_price') {
      var link = "https://api.cryptokitties.co/auctions";
      link += '?offset=' + offset;
      link += '&limit=' + limit;
      link += '&type=sale';
      link += '&status=open';
      link += '&search=' + search;
      link += '&sorting=' + sort;
      link += '&orderBy=' + order;
      link += '&orderDirection=asc';
      return link;
    };
    $scope.getKitty = function(kit) {
      var deferred = $q.defer();
      $http({
        method: 'GET',
        url: "https://api.cryptokitties.co/kitties/" + kit.id
      }).then(function successCallback(response) {
        kit.cattributes = response.data.cattributes;
        // kit.matron = response.data.matron;
        deferred.resolve();
      });
      return deferred.promise;
    };
    $scope.searchCrykit = function() {
      $scope.auctionData = [];
      var link = $scope.getLink(0, 100, $scope.form.search);

      console.log("Sending probe...");

      $scope.sendProbe(link)
        .then(function(response) {
          var linkArr = [];
          var total = Math.ceil(response.data.total / 100);
          console.log("Total:", response.data.total);
          for (var i = 0; i < total; i++) {
            linkArr.push($scope.getLink(i * 100, 100, $scope.form.search));
          };

          $scope.dataPromiseChain = $q.when();

          linkArr.forEach(function(link) {
            $scope.dataPromiseChain = $scope.dataPromiseChain.then(function() {
              return $scope.getData(link);
            });
          });
          $scope.dataPromiseChain.finally(function() {
            console.log("Post processing");
            console.log($scope.auctionData);
          });

        }, function(error) {

        });
    };
    $scope.upgradeData = function() {
      $scope.auctionData.forEach(function(kit) {
        var dataPromiseChain = $q.when();

        dataPromiseChain = dataPromiseChain.then(function() {
          return $scope.getKitty(kit);
        });

      });
    }
    $scope.sendProbe = function(link) {
      return $http({
        method: 'GET',
        url: link
      });
    };
    $scope.processKittyData = function(kittyArr) {
      _.each(kittyArr, function(kitty) {
        kitty.current_price = (kitty.current_price / 1000000000000000000).toFixed(5);
        kitty.end_price = (kitty.end_price / 1000000000000000000).toFixed(5);
        kitty.start_price = (kitty.start_price / 1000000000000000000).toFixed(5);

        kitty.end_time_f = new Date(+kitty.end_time).toLocaleString();
        kitty.start_time_f = new Date(+kitty.start_time).toLocaleString();
        kitty.end_timer_f = $scope.msToTime($scope.dateDiff(new Date(+kitty.end_time), new Date(+kitty.start_time)));
        kitty.end_timer = $scope.dateDiff(new Date(+kitty.end_time), new Date(+kitty.start_time));;
        kitty.duration_f = $scope.msToTime(kitty.duration);

        kitty.cooldown_index = kitty.kitty.status.cooldown_index;
        kitty.id = kitty.kitty.id;
      });

      return kittyArr;
    }
    $scope.msToTime = function(millisec) {
      var seconds = (millisec / 1000).toFixed(1);
      var minutes = (millisec / (1000 * 60)).toFixed(1);
      var hours = (millisec / (1000 * 60 * 60)).toFixed(1);
      var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

      if (seconds < 60) {
        return seconds + " Sec";
      } else if (minutes < 60) {
        return minutes + " Min";
      } else if (hours < 24) {
        return hours + " Hrs";
      } else {
        return days + " Days"
      }
    };
    $scope.dateDiff = function(date1, date2) {
      return (date1.getTime() - date2.getTime());
    }

    $scope.getSetAttrStats = function() {
      var attr = {};
      $scope.auctionData.forEach(function(kit) {
        kit.cattributes.forEach(function(a) {
          if (!attr[a]) { attr[a] = 1 } else { attr[a] = attr[a] + 1 }
        });
      });
      console.log(attr);
      return attr;
    };

    $scope.sort = {};
    $scope.sort.prop = '';
    $scope.reverse = false;

    $scope.sort = function(prop) {
      if ($scope.sort.prop === prop) {
        $scope.reverse = !$scope.reverse;
        $scope.auctionData.reverse();
      } else {
        $scope.reverse = false;
        $scope.sort.prop = prop;
        $scope.auctionData = _.sortBy($scope.auctionData, function(kit) {
          return kit[prop]
        });
      }
    };



    // $scope.init();

  });
