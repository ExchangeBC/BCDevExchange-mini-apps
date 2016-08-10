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
        .state('app.developers', {
          url          : '/developers/:program',
          templateUrl  : 'app/views/apps/developers.html',
          data         : {authorizedRoles: [USER_ROLES.all]},
          resolve      : {
            issues : function ($resource, $http, $stateParams) {
              // return $resource ('/api/issues/:program').get ({});
              var program = $stateParams.program || '';
              return $http ({method:'GET', url:'/api/issues/'+program});
            }
          },
          controllerAs : 'v',
          controller   : function ($scope, issues) {
            var v = this;
            console.log ('issues', issues);
            console.log ('issues.closed.length = ', issues.data.closed.length);
            v.closedIssues   = issues.data.closed || [];
            v.openIssues     = issues.data.open || [];
            v.blockedIssues  = issues.data.blocked || [];
            v.assignedIssues = issues.data.inprogress || [];
            // $scope.$apply ();
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
