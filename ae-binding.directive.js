
/**
 *
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 /**
  * Based on https://github.com/robdodson/angular-custom-elements 
  * Modifications for @angular/elements
  */

/**
 *
 * Copyright 2018 remackgeek. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


angular
.module('ae-bind', [])
.directive('aeBinding', ['$parse', aeBinding]);

// Make Angular 1.x interpolated bindings work.
// Finds interpolated bindings and sets up event listeners
// to hear when the underlying @angular/elements property updates.
// Because @angular/elements changes are event based
// we can listen for the [prop]Change event dispatched
// by a @angular/elements element and apply the new value to the
// controller's scope.
// This also works for vanilla Custom Elements so long as
// they dispatch a [prop]Change event where
// event.detail equals the new value
function aeBinding($parse) {
return {
  restrict: 'A',
  scope: false,
  compile: function($element, $attrs) {
    var attrMap = {};

    for (var prop in $attrs) {
      if (angular.isString($attrs[prop])) {
        var _match = $attrs[prop].match(/\{\{\s*([$\.\w]+)\s*\}\}/);
        if (_match) {
          attrMap[prop] = $parse(_match[1]);
        }
      }
    }

    return function($scope, $element, $attrs) {

      function applyChange(event) {
        var attributeName, newValue, oldValue, getter, setter;
        // Figure out what changed by the event type
        // Convert the event from dash-case to camelCase with $normalize
        // So we can get it out of the attrMap
        attributeName = $attrs.$normalize(
          event.type.substring(0, event.type.indexOf('Change'))
        );

        if (attributeName in attrMap) {

          newValue = event.detail;
      
          getter = attrMap[attributeName];
          setter = getter.assign;
          oldValue = getter($scope);

          if (!angular.equals(newValue, oldValue) && angular.isFunction(setter)) {
            $scope.$evalAsync(function($scope) {
              if (angular.isArray(newValue)) {
                // FIXME: This is probably not going to work if we're
                // mutating the array inside of an ng-repeat. Probably
                // need to mutate the original array being referenced
                // so we don't shadow the property on the prototype by
                // assigning a new object 
                setter($scope, newValue);
              } else if (angular.isObject(newValue)) {
                Object.assign(oldValue, newValue);
              } else {
                setter($scope, newValue);
              }
            });
          }
        }
      }

      for (var prop in attrMap) {
        $element[0].addEventListener(prop + 'Change', applyChange);
      }

      $scope.$on('$destroy', function() {
        for (var prop in attrMap) {
          $element[0].removeEventListener(prop + 'Change', applyChange);
        }
      });
    }
  }
};
}