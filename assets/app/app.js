/**

Copyright 2016, Cloud Compass Computing, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/
'use strict';

var sbapp = angular.module('sbapp', [
  'ngResource',
  'ngAnimate',
  'ngCookies',
  'ngSanitize',
  'ui.router',
  'ct.ui.router.extras.previous',
  'ngMaterial',
  'nvd3',
  'ngSails',
  'ngMessages'
]);

sbapp
// Define GLOBAL constants
  .constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
  })
  .constant('USER_ROLES', {
    all: '*',
    admin: 'admin',
    editor: 'editor',
    guest: 'guest'
  })

  .factory('AuthInterceptor',
    function ($rootScope, $q, AUTH_EVENTS) {
      return {
        responseError: function (response) {
          $rootScope.$broadcast({
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
          }[response.status]);
          return $q.reject(response);
        }
      };
    }
  )

  .config(
    function (USER_ROLES, $httpProvider, $stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider) {

      // Broadcast events upon 4xx responses from server
      $httpProvider.interceptors.push([
        '$injector',
        function ($injector) {
          return $injector.get('AuthInterceptor');
        }
      ]);

      // Define UI states
      $stateProvider
        // -------------------------------------------------------------------------
        //
        // start apps
        //
        // -------------------------------------------------------------------------
        .state('app', {
          url: '/app',
          templateUrl: 'app/views/apps/main.html',
          abstract: true,
          data: {
            authorizedRoles: [USER_ROLES.all]
          }
        })
        // -------------------------------------------------------------------------
        //
        // developers app
        //
        // -------------------------------------------------------------------------
        .state ('app.developers', {
          url          : '/developers/:program',
          templateUrl  : 'app/views/apps/developers.html',
          data         : {authorizedRoles: [USER_ROLES.all]},
          controllerAs : 'v',
          resolve      : {
            issues : function ($resource, $http, $stateParams) {
              // return $resource ('/api/issues/:program').get ({});
              var program = $stateParams.program || '';
              return $http ({method:'GET', url:'/api/issues/'+program});
            }
          },
          controller   : function ($scope, issues, $document, $timeout) {
            var v = this;
            v.closedIssues   = issues.data.closed || [];
            v.openIssues     = issues.data.open || [];
            v.blockedIssues  = issues.data.blocked || [];
            v.assignedIssues = issues.data.inprogress || [];


            //
            // HACK HACK KLUDGE KLUDGE
            //
            // dear future Chris,
            // please leave this alone. It seems that the nested one is needed
            // for some unknown reason.
            //
            $timeout(function() {
            $timeout(function() {
              var B = document.body,
              H = document.documentElement,
              height;

                // console.log( (document.height || 0), B.scrollHeight, B.offsetHeight,H.clientHeight, H.scrollHeight, H.offsetHeight );
                height = Math.max( (document.height || 0), B.scrollHeight, B.offsetHeight,H.clientHeight, H.scrollHeight, H.offsetHeight );
                height = $document.height();
                height = $document.find ('#allissues').height();
              // var height = document.body.scrollHeight;
              // height = 200;
              // console.log ('scroll height = ', height+'px');
              window.parent.postMessage(document.body.scrollHeight+'px', '*');
            });
            });
          }
        })
        // -------------------------------------------------------------------------
        //
        // Card Progress From KanBan Trello Baords
        //
        // -------------------------------------------------------------------------
        .state ('app.cardprogressstatic', {
          url          : '/cardprogressstatic/:board',
          templateUrl  : 'app/views/apps/cardprogressstatic.html',
          data         : {authorizedRoles: [USER_ROLES.all]},
        })
        .state ('app.cardprogress', {
          url          : '/cardprogress/:board',
          templateUrl  : 'app/views/apps/cardprogress.html',
          data         : {authorizedRoles: [USER_ROLES.all]},
          controllerAs : 'zz',
          resolve      : {
            lists      : function ($http, $stateParams) {
              var board = $stateParams.board || '';
              return $http ({method:'GET', url:'/api/listdist/'+board});
            }
          },
          controller   : function ($scope, $document, $window, lists) {
            var zz = this;
            zz.allcards = lists;
            var data = lists.data;
            _.each (data, function (list) {
              list.count = list.cards.length;
            });
            var boardUrl = data[0].boardUrl;

            var maincolours = {
              done:"#98ac7a", // green
              backlog:"#81bed6", // blue
              blocked:"#e99181", // red
            };
            var othercolours = [
            "#d29adf",
            "#d891b9",
            "#e5dba7",
            "#a69dcc",
            "#d6ab7f",
            "#a88b88",
            "#eac2cc"
            ];


            var total = data.reduce (function (prev, curr) {
              return prev + curr.count;
            }, 0);


            //
            // first decorate and set indexes depending on state,
            // we want backlog first, done last, etc.
            //
            var i = 0;
            var colourIndex = 0;
            var namedStates = {};
            data.forEach (function (v) {
              var name = v.name.toLowerCase ();
              if (maincolours[name]) {
                v.colour = maincolours[name];
                namedStates[name] = v;
                if (name === 'backlog') v.index = -1;
                else if (name === 'done') v.index = 99999;
                else if (name === 'blocked') v.index = 99998;
              } else {
                v.colour = othercolours[colourIndex++];
                v.index = i++;
              }
            });
            //
            // sort
            //
            data.sort (function (a, b) {
              if (a.index < b.index) return -1;
              else if (a.index > b.index) return 1;
              else return 0;
            });


            var render = function () {
              var w = window,
                  d = $document[0],
                  e = d.documentElement,
                  g = d.getElementsByTagName('body')[0],
                  x = w.innerWidth || e.clientWidth || g.clientWidth,
                  y = w.innerHeight|| e.clientHeight|| g.clientHeight;




             var linearScale = d3.scale.linear ()
              .domain ([0, total])
              .range ([0,x]);
             //
              // now in the right order set screen x and width
              //
              var prev = 0;
              data.forEach (function (v) {
                v.left  = prev;
                v.width = linearScale (v.count);
                prev    += v.width;
              });

              var svgContainer = d3.select ('div#chartid')
              // var svgContainer = d3.select ('body')
                .append ('a')
                .attr ('href', boardUrl)
                .attr ('target', '_blank')
                .append ('div')
                // .classed ('svg-container', true)
                .append ('svg')
                .attr('preserveAspectRatio', 'xMinYMin meet')
                .attr('viewBox', '0 0 '+x+' '+y)
                .attr ('width', x)
                .attr ('height', y)
                .attr('xmlns', 'http://www.w3.org/2000/svg')
                // .classed ('svg-content-responsive', true)
                ;


              var rectangles = svgContainer.selectAll("rect")
                                           .data(data)
                                           .enter()
                                           .append("rect");
//data-toggle="tooltip" data-placement="left" title="Tooltip on left"
              var rectangleAttributes = rectangles
                                        .attr("x", function (d) { return d.left; })
                                        .attr("y", 0)
                                        .attr("height", 2000)
                                        .attr("width", function (d) { return d.width; })
                                        .style("fill", function(d) { return d.colour; })
                                        .attr ('data-toggle', 'tooltip')
                                        .attr ('title', function(d) { return d.name; })
                                        .attr ('data-placement', 'top')

                                        ;
            };

            angular.element($window).bind('resize', function () {
              render ();
            });

            render ();

          }
        })
      ;

      // Redirect unknown URLs
      $urlRouterProvider.otherwise('/welcome');

      // THEMING
      $mdThemingProvider
        .theme('default')
        .primaryPalette('amber', {
          'default': '500',
          'hue-1': '100',
          'hue-2': '300',
          'hue-3': '700'
        })
        .accentPalette('teal', {
          'default': '500',
          'hue-1': '100',
          'hue-2': '300',
          'hue-3': '700'
        })
        .warnPalette('warn');

      $mdThemingProvider.theme('dark', 'default')
        .primaryPalette('amber')
        .dark();

      $mdThemingProvider.theme('grey', 'default')
        .primaryPalette('grey');

      $mdThemingProvider.definePalette('warn', {
        '50': '#FFFFFF',
        '100': 'rgb(255, 198, 197)',
        '200': '#E75753',
        '300': '#E75753',
        '400': '#E75753',
        '500': '#E75753',
        '600': '#E75753',
        '700': '#E75753',
        '800': '#E75753',
        '900': '#E75753',
        'A100': '#E75753',
        'A200': '#E75753',
        'A400': '#E75753',
        'A700': '#E75753'
      });

      $mdIconProvider.icon('user', 'assets/images/user.svg', 64);
    }
  )

;
