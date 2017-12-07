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

        $scope.lastLink = '';
        $scope.lastIndex = '';

        $scope.total = 0;
        $scope.loaded = 0;

        $scope.cooldown = ["Fast", "Swift", "Swift", "Snappy", "Snappy", "Brisk", "Brisk", "Plodding", "Plodding", "Slow", "Slow", "Sluggish", "Sluggish"];
        $scope.rarity = { "kittencream": 5.34, "chestnut": 1.34, "soserious": 2.63, "thicccbrowz": 3.15, "royalpurple": 1.87, "himalayan": 2.98, "totesbasic": 6.46, "aquamarine": 2.42, "ragamuffin": 2.79, "raisedbrow": 2.77, "lemonade": 2.22, "pouty": 3.18, "greymatter": 2.6, "topaz": 2.09, "strawberry": 2.69, "shadowgrey": 1.83, "luckystripe": 4.06, "tongue": 1.44, "granitegrey": 5.83, "barkbrown": 1.05, "orangesoda": 2.22, "crazy": 3.67, "tigerpunk": 0.73, "salmon": 1.97, "coffee": 1.71, "sizzurp": 3, "bubblegum": 0.55, "munchkin": 2.44, "spock": 0.42, "skyblue": 0.72, "mauveover": 0.84, "simple": 2.52, "laperm": 1, "beard": 0.9, "swampgreen": 2.15, "happygokitty": 2.67, "chocolate": 2.35, "mintgreen": 2.08, "saycheese": 1.38, "sphynx": 2.4, "limegreen": 0.75, "calicool": 0.83, "cymric": 0.9, "peach": 0.15, "cloudwhite": 0.62, "otaku": 0.36, "emeraldgreen": 0.7, "bloodred": 0.48, "dali": 0.31, "scarlet": 0.41, "cerulian": 0.03, "fabulous": 0.03 };
        $scope.calcScore = function(arr) {
            var a = 0;
            arr.forEach(function(b) {
                a += $scope.rarity[b];
            });
            return a;
        };
        $scope.showScore = function(cattributes) {
            console.log("****************************");
            cattributes.forEach(function(a) {
                console.log(a + ": ", $scope.rarity[a]);
            });
            console.log("****************************");
            console.log($scope.calcScore(cattributes));
            console.log("****************************");
        }
        $scope.getData = function(link, index) {
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: link
            }).then(function successCallback(response) {
                scope.loaded += 100;
                $scope.auctionData = $scope.auctionData.concat($scope.processKittyData(response.data.auctions));
                deferred.resolve();
            }, function errorCallback(error) {
                $scope.lastLink = angular.copy(link);
                $scope.lastIndex = index;
            });
            return deferred.promise;
        }
        $scope.retry = function() {
            $scope.searchCrykit(true)
        };
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
                kit.cattributes = _.pluck(response.data.cattributes, 'description');
                kit.score = $scope.calcScore(kit.cattributes);
                // kit.matron = response.data.matron;
                deferred.resolve();
            });
            return deferred.promise;
        };
        $scope.searchCrykit = function(retry = false) {
            if (!retry) {
                $scope.auctionData = [];
            }
            var link = $scope.getLink(0, 1, $scope.form.search);

            console.log("Sending probe...");

            $scope.sendProbe(link)
                .then(function(response) {
                    var linkArr = [];
                    var total = $scope.total = Math.ceil(response.data.total / 100);
                    console.log("Total:", response.data.total);

                    var i = 0;
                    if (retry) {
                        i = angular.copy($scope.lastIndex);
                    }

                    for (i; i < total; i++) {
                        linkArr.push({ link: $scope.getLink(i * 100, 100, $scope.form.search), index: i });
                    };

                    $scope.dataPromiseChain = $q.when();

                    linkArr.forEach(function(link, index) {
                        $scope.dataPromiseChain = $scope.dataPromiseChain.then(function() {
                            return $scope.getData(link.link, link.index);
                        });
                    });
                    $scope.dataPromiseChain.finally(function() {
                        console.log("Post processing");
                        scope.loaded = 0;
                        console.log($scope.auctionData);
                    });

                }, function(error) {
                  setTimeout(function () {
                    $scope.retry();
                  }, 30000);
                });
        };
        $scope.upgradeData = function() {
            var dataPromiseChain = $q.when();
            $scope.auctionData.forEach(function(kit) {
                dataPromiseChain = dataPromiseChain.then(function() {
                    return $scope.getKitty(kit);
                });

            });
        }
        $scope.upgradeDataFast = function() {
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

                kitty.end_timer = (((+kitty.current_price - (+kitty.end_price)) / (+kitty.start_price - (+kitty.end_price))) * +kitty.duration).toFixed(0);
                kitty.end_timer_f = $scope.msToTime(kitty.end_timer);

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
                kit.cattributes = kit.cattributes || [];
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
                    try {
                        kit[prop] = +kit[prop];
                    } catch (err) {
                        kit[prop] = kit[prop];
                    };
                    return kit[prop]
                });
            }
        };



        // $scope.init();

    });