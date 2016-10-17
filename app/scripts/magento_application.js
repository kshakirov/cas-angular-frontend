var magento_module = angular.module('MagentoApp', ['rzModule',
    'angularSpinner', 'elasticsearch', 'ngRoute', 'ngCookies',
    'ngTouch', 'ngAnimate', 'ngFader', 'angular-preload-image', 'ngSanitize', 'ngDialog', 'ngTable', 'angular-spinkit']);

magento_module.run(function($rootScope) {
    $rootScope.flags = {catalog: false};

});

magento_module.service('ElasticSearch', function (esFactory) {
    function _get_hostname() {
        var host = location.hostname + ":10000";
            return host
    }
    var hostname = _get_hostname();
    return esFactory({
        host: hostname + "/elastic"
    });
});

magento_module.service('SortUtils', function () {
    this.getFullCode = function (sorter) {
        if (sorter.type == "int")
            return sorter.code + "." + "code"
        else
            return sorter.code
    }
})

magento_module.controller("AboutUsController", function ($rootScope, $scope){
    $rootScope.pageTitle=": About Us";
})

magento_module.controller("ContactUsController", function ($rootScope, $scope){
    $rootScope.pageTitle=": Contact Us";
})






