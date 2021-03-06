magento_module.controller("CustomerAddressEditController", function ($scope,
                                                                     $rootScope,
                                                                     $http,
                                                                     $routeParams,
                                                                     $location) {


  var current_address = false;
  $scope.log = {
    address: {
      success: false,
      error: false
    }
  }

  function _get_address_type(address_id) {
    if (address_id == 1)
      return 'default_billing_address'
    return 'default_shipping_address';
  }

  function not_empty_string(string) {
    return string.length > 0;
  }

  function _create_empty_address() {
    return {
      city: '',
      country_id: '',
      name: '',
      postcode: '',
      region_id: '',
      street: '',
      telephone: ''
    }
  }


  function check_address_name(address, customer) {
    if (address.hasOwnProperty('name') && not_empty_string(address.name)) {
      return address.name;
    }
    return address.name = customer.firstname + " " + customer.lastname
  }

  $scope.init = function () {
    current_address = $routeParams.id | false;
    $http.get("/customer/account").then(function (promise) {
      $scope.customer = promise.data;
      if (current_address) {
        if ($scope.customer[_get_address_type(current_address)] == null) {
          $scope.customer[_get_address_type(current_address)] = _create_empty_address();
        }
        $scope.address = $scope.customer[_get_address_type(current_address)];
        $scope.address.name = check_address_name($scope.address, $scope.customer)
      }
      $scope.addressReady = true;
    })
  }


  $scope.save = function (customer) {
    var data = {id: customer.id, firstname: customer.firstname, lastname: customer.lastname};
    data[_get_address_type(current_address)] = customer[_get_address_type(current_address)];
    $http.put("/customer/account/address/", data).then(function (promise) {
      $scope.log.address.success = true;
      $scope.log.address.error = false;
    }, function (error) {
      $scope.log.address.success = false;
      $scope.log.address.error = true;
      $scope.log.address.error_message = error.data.message;
    })
  }
})
