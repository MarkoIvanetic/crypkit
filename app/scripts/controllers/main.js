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
        $scope.rarity = {"violet":0.013485,"googly":0.212381,"wingtips":0.355654,"mainecoon":0.406221,"jaguar":0.470273,"whixtensions":0.707937,"cerulian":0.986055,"chartreux":1.174839,"fabulous":1.977167,"peach":2.50812,"gold":2.668249,"bubblegum":4.392581,"scarlet":5.006127,"dali":5.009498,"otaku":5.011184,"bloodred":5.294359,"skyblue":6.204563,"emeraldgreen":7.074315,"spock":7.2395,"limegreen":7.585041,"tigerpunk":7.704716,"beard":8.921694,"mauveover":9.481301,"cloudwhite":9.954945,"laperm":10.022367,"calicool":10.136986,"barkbrown":10.175754,"chestnut":11.505664,"cymric":11.672535,"tongue":13.155832,"saycheese":14.22448,"coffee":17.89564,"shadowgrey":17.952949,"salmon":18.775505,"royalpurple":19.459844,"chocolate":21.293738,"mintgreen":21.731985,"swampgreen":21.801093,"topaz":22.047186,"simple":22.155062,"lemonade":22.170232,"orangesoda":22.220799,"aquamarine":22.648932,"munchkin":22.829288,"sphynx":22.83603,"raisedbrow":23.016385,"greymatter":23.973786,"happygokitty":26.845988,"strawberry":26.857787,"ragamuffin":27.471333,"soserious":27.498302,"sizzurp":28.212981,"himalayan":28.602347,"pouty":28.634372,"crazy":35.873873,"thicccbrowz":36.40314,"luckystripe":40.281624,"granitegrey":54.308893,"kittencream":55.788819,"totesbasic":59.158263};
        $scope.calcScore = function(arr) {
            var a = 0;
            arr.forEach(function(b) {
                a += $scope.rarity[b];
            });
            return a / 10;
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
                $scope.loaded += 1;
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
                $scope.loaded++;
                kit.cattributes = _.pluck(response.data.cattributes, 'description');
                kit.score = $scope.calcScore(kit.cattributes);
                // kit.matron = response.data.matron;
                deferred.resolve();
            });
            return deferred.promise;
        };
        $scope.searchCrykit = function(retry = false) {
            if (!retry) {
               // $scope.auctionData = [];
            }
            var link = $scope.getLink(0, 1, $scope.form.search);

            console.log("Sending probe...");

            $scope.sendProbe(link)
                .then(function(response) {
                    var linkArr = [];
                    var total = $scope.total = Math.ceil(response.data.total / 100);
                    $scope.loaded = 0;
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