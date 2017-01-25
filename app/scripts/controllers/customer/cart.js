magento_module.controller("CustomerCart", function ($scope,
                                                              $rootScope, $http,
                                                              $cookies, $location) {




  function load_cart() {
    return   $http.get('/customer/cart').then(function (promise) {
        return promise.data;
    })
  }

  function is_cart_empty(cart) {
     if(cart && cart.hasOwnProperty('items'))
       return Object.keys(cart.items) == 0;
  }

  

  $scope.init = function () {
    console.log("Hi Cart");
    return load_cart().then(function (data) {
      $scope.cart_data = data;
      $scope.emptyCart = is_cart_empty(data);
      console.log($scope.emptyCart);
    })
  }

  $scope.removeProductFromCart = function (sku) {
    console.log(sku + " To delete");
    $http.delete('/customer/cart/product/' + sku).then(function () {
      return sku;
    }).then(function (sku) {
        load_cart().then(function (data) {
          $scope.cart_data = data;
          $scope.emptyCart = is_cart_empty(data);
        })
    })
  }

  $scope.checkout = function () {
    $location.path("/customer/checkout")
  }


})