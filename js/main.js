var dashboardApp = angular.module('dashboardApp', []);

$(function () {
  $("ul.nav li").click(function () {
    $("ul.nav li").removeClass('active');
    $(this).addClass('active');
  });
});


//Define Routing for the app
//Uri /xfails -> xfails.html and Controller XfailsController
//Uri /marketplace -> template marketplace.html and Controller MarketplaceController
//Uri /issues -> template issues.html and Controller IssuesController
dashboardApp.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider.
      when('/issues', {
        templateUrl: 'templates/issues.html',
        controller: 'IssuesController'
      }).
      otherwise({
        redirectTo: '/issues'
      });
  }]);

dashboardApp.controller('IssuesController', function ($scope, $http, filterFilter) {

  $scope.init = function () {
    $("#nav-issues").addClass('active');
    var aggregator = new GithubIssuesAggregator();

    $scope.issueFilters = {'hasPullRequest': '', 'hasAssignee': ''};

    var labelArray = ['Community', 'blocked',
      'difficulty beginner', 'difficulty intermediate', 'difficulty advanced',
      'priority low', 'priority medium', 'priority high']
    $scope.labels = labelArray.map(function (label) {
      return {'name': label, selected: false}
    });

    // selected labels
    $scope.selection = [];

    // helper method
    $scope.selectedLabels = function selectedLabels() {
      return filterFilter($scope.labels, { selected: true });
    };

    aggregator.processIssues(function (data) {
      $scope.issues = data.issues;
      $scope.last_updated = data.last_updated;

      // watch labels for changes
      $scope.$watch('labels|filter:{selected:true}', function (nv) {
        $scope.selection = nv.map(function (label) {
          return label.name;
        });
        $scope.showHideIssues();
      }, true);

      // Set up display properties for the issues
      angular.forEach($scope.issues, function (repo) {
        repo.show = true;
        angular.forEach(repo.issues, function (issue) {
          issue.shouldShow = true;
        });
      });
      setTimeout(Hyphenator.run, 200);
      $scope.$apply();
    });

  }

  $scope.toggleRepo = function (repo) {
    repo.show = !repo.show;
  }

  $scope.showHideIssues = function () {
    for (var a = 0; a < $scope.issues.length; a++) {
      issues = $scope.issues[a].issues;
      for (var b = 0; b < issues.length; b++) {
        issue = issues[b];
        issue.shouldShow = $scope.hasPullRequest == 'undefined' | $scope.hasPullRequest == null | $scope.hasPullRequest == '' |
          (issue.pull_request && $scope.hasPullRequest == 'yes') |  (!issue.pull_request && $scope.hasPullRequest == 'no');
        var showForLabels = true;
        if (issue.shouldShow && $scope.selectedLabels().length > 0) {
          showForLabels = false;
          matchedLabels = 0;
          for (var c = 0; c < issue.labels.length; c++) {
            for (var d = 0; d < $scope.selectedLabels().length; d++) {
              if (issue.labels[c]['name'] == $scope.selectedLabels()[d].name) {
                matchedLabels++;
              }
            }
          }
          if (matchedLabels == $scope.selectedLabels().length) {
            showForLabels = true;

          }
          issue.shouldShow = issue.shouldShow && showForLabels;
        }
        var showForAssignee = true;
        if (issue.shouldShow && $scope.hasAssignee != 'undefined' && $scope.hasAssignee != null | $scope.hasAssignee == '') {
          showForAssignee = $scope.hasAssignee == ''
                            | (issue.assignee.name && $scope.hasAssignee == 'yes')
                            | (!issue.assignee.name && $scope.hasAssignee == 'no');
          issue.shouldShow = issue.shouldShow && showForAssignee;
        }
      }
    }

  }

});
