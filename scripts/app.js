'use strict';
var myApp = angular.module('myApp', [
    'caph.focus',
    'caph.ui',
    'dibari.angular-ellipsis',
	'youtube-embed',
	'ngProgress',
]).config(['focusControllerProvider', function(focusControllerProvider) {
    focusControllerProvider.setInitialDepth(0);
}]);