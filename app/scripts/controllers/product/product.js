magento_module.controller("ProductController", function ($scope,
                                                         $rootScope, $http,
                                                         $routeParams,
                                                         $cookies, $filter,
                                                         NgTableParams,
                                                         StatisticElasticQuery,
                                                         ElasticSearch,
                                                         $timeout,
                                                         $filter,
                                                         KitMatrixService) {

    function _get_stats() {
      var stats = $cookies.getObject('stats');
      return stats;
    }

    function _create_link_to_product(product) {
      return "<a href='#/part/sku/" + product.sku + "'>" + product.partNumber + "</a>"
    }

    function _add_see_more_item(links_array) {
      var links_array = links_array.slice(0, 10);
      links_array.push("<i>..... see below for  more</i>");
      return links_array;
    }

    function _sort_by_part_number(links) {
      return $filter('orderBy')(links, 'partNumber', false)
    }

    function _get_ti_serviced_turbos(where_used) {
      var links_array = _sort_by_part_number(where_used).map(function (current) {
        return _create_link_to_product(current);
      });
      if (links_array.length > 10) {
        return _add_see_more_item(links_array).join(", ");

      } else {
        return links_array.join(", ");
      }
    }

    function _bom_object_2_array(boms) {
      angular.forEach(boms, function (bom) {
        var interchages_flat = bom.interchanges.map(function (interchange) {
          return interchange.part_number;
        })
        bom.interchanges_flat = interchages_flat;
      })
    }

    var compared_message_dismiss = function () {
      $scope.compared_message = false;
    };

    function _add_part_type_sort_field(current, sort_value) {
      current.oe_part_number_sort_field = sort_value;
    };

    function _is_cartridge(current) {
      return current.part_type == 'Cartridge'
    };

    function _sort_major_components(major_components) {
      return major_components.map(function (current, index, array) {
        if (_is_cartridge(current)) {
          _add_part_type_sort_field(current, "1")
          return current;
        } else {
          _add_part_type_sort_field(current, current.oe_part_number)
          return current;
        }
      })
    }

    function get_matrix_skus(cols) {
      var skus = cols.map(function (col) {
        return col.sku;
      })
      return skus;
    }

    function turbo_interchanges_to_string(turbo) {
      if (turbo.interchanges) {
        var strs_array = turbo.interchanges.map(function (t) {
          return t.part_number
        })
        return strs_array.join(", ");
      }
    }

    function process_turbos_interchanges(turbos) {
      return turbos.map(function (turbo) {
        turbo.interchanges = turbo_interchanges_to_string(turbo);
      })
    }

    function make_flat_interchanges(stds) {
      angular.forEach(stds, function (std) {
        var interchages_flat = std.interchanges.map(function (interchange) {
          return interchange.part_number;
        })
        std.interchanges_flat = interchages_flat;
      })
    }


    function get_products_count() {
      return $http.get('/customer/cart/product/count').then(function (promise) {
        return promise.data.count;
      })
    }

    function _get_part_number(product) {
        if (product.manufacturer.toLowerCase() == 'turbo international'){
          return product.part_number;
        }
      return product.ti_part_number;
    }

    $scope.tab = 1;
    $scope.qty = 1;
    $rootScope.pageTitle = ": Product";

    $scope.idSelectedPart = null;
    $scope.setSelectPart = function (idSelectedPart, col, index) {
      $scope.idSelectedPart = idSelectedPart;
      $scope.selectedCol = col;
    };

    $scope.selectedCols = function (title) {
      if ($scope.selectedCol == title.title)
        return 'selected';
    }

    $scope.selectedColsDesc = function (row) {
      if ($scope.idSelectedPart == row.part_number)
        return 'selected';
    }

    $scope.selectedOversize = function (item, original_part) {
      if (item.sku == $scope.std_reference)
        return 'selected_std';
    }

    $scope.is_cartride = function () {
      if ($scope.product && $scope.product.part_type)
        return $scope.product.part_type.toLowerCase() == 'cartridge';
    };

    $scope.is_gasket_kit = function () {
      if ($scope.product && $scope.product.part_type)
        return $scope.product.part_type.toLowerCase() == 'gasket kit';
    };

    $scope.is_journal_bearing = function () {
      if ($scope.product && $scope.product.part_type)
        return $scope.product.part_type.toLowerCase() == 'journal bearing';
    };

    $scope.is_piston_ring = function () {
      if ($scope.product && $scope.product.part_type)
        return $scope.product.part_type.toLowerCase() == 'piston ring';
    };

    $scope.is_turbo = function () {
      if ($scope.product && $scope.product.part_type)
        return $scope.product.part_type.toLowerCase() == 'turbo';
    };

  $scope.is_actuator = function () {
    if ($scope.product && $scope.product.part_type)
      return $scope.product.part_type.toLowerCase() == 'actuator';
  };

    $scope.is_Ti_manufactured = function () {
      if ($scope.product && $scope.product.manufacturer)
        return $scope.product.manufacturer.toLowerCase() == 'turbo international';
    };

    function _get_price(sku) {
      return $http.get('/customer/product/' + sku + '/price').then(function (promise) {
        return [true, promise.data.price]
      }, function (error) {
        return [false]
      });
    }


    $scope.addToCart = function (qty) {

      var product = {
        product: $scope.product,
        price: $scope.price,
        qty: qty
      };

      var part_number = _get_part_number(product.product);

      $http.post('/customer/cart/product', product).then(function (response) {
        console.log("sent to cart");
        $scope.cart_message = part_number + " was added to your shopping cart."
        return true;
      }).then(function () {
        get_products_count().then(function (promise) {
          $rootScope.product_count = promise;
        })
      })
    };

    $scope.kit_matrix_ready = function () {
      if ($scope.kit_matrix)
        return $scope.kit_matrix.length > 0;
      return false;
    };

    $scope.getWhereUsedHeader = function () {
      if ($scope.is_turbo()) {
        return "OE Part"
      } else if ($scope.is_cartride() || $scope.is_actuator()) {
        return "Turbo OE Part"
      } else {
        return "Cartridge OE Part"
      }
    };

    $scope.isAuthorised = function () {
      return this.authorised;
    };
    $scope.isCriticalPart = function () {
      if ($scope.product && $scope.product.hasOwnProperty('critical')) {
        if ($scope.product.critical.length > 0)
          return true;
        else
          return false;
      }
    };


    function initCount() {
      return $http.get("/customer/compared_product/count/").then(function (promise) {
        return promise.data.count;
      })
    }


    $scope.addProductToComparedProducts = function (id) {
      var sku = $routeParams.sku;
      $http.put("/customer/compared_product/" + sku).then(function (promise) {
        $scope.compared_message = $scope.product.part_number + " was added to your shopping cart."
      }).then(function (promise) {
        initCount().then(function (count) {
          $rootScope.compared_product_count = count;
        })
      })
    }

    $scope.init = function () {
      var sku = $routeParams.sku;
      $rootScope.image_sku = sku;
      $rootScope.price_sku = sku;
      var stats = [_get_stats()];

      $http.post('/frontend/product', {sku: sku, stats: _get_stats()}).then(function (promise) {
        $scope.product = promise.data;
        $rootScope.image_part_type = $scope.product.part_type;
        $scope.applicationTableParams = new NgTableParams({}, {dataset: $scope.product.application_detail});
      }).then(function (promise) {
        if ($scope.product.hasOwnProperty('ti_part_sku') && $scope.product.ti_part_sku) {
          $rootScope.price_sku = $scope.product.ti_part_sku;
          _get_price($scope.product.ti_part_sku).then(function (promise) {
            $scope.authorised = promise[0];
            $scope.price = promise[1]
          });
        }
        else {
          _get_price(sku).then(function (promise) {
            $scope.authorised = promise[0];
            $scope.price = promise[1]
          });
        }
      });


      $http.post('/attrsreader/product/' + sku + '/where_used/', stats).then(function (prom) {
        var where_used = [];
        if (typeof prom.data == 'object') {
          where_used = KitMatrixService.hash2array(prom.data);
          $scope.tiServiced = _get_ti_serviced_turbos(where_used);
        }
        $scope.where_usedTableParams = new NgTableParams({}, {dataset: where_used});
      });

      $http.get('/attrsreader/product/' + sku + '/bom/?stats=' + _get_stats()).then(function (prom) {
        var boms = [];
        if (typeof prom.data == 'object') {
          boms = prom.data;
          _bom_object_2_array(boms);
        }
        $scope.bomTableParams = new NgTableParams({
          sorting: {part_number: "asc"},
          page: 1,
          count: 25
        }, {dataset: boms});
      });


      $http.get('/attrsreader/product/' + sku + '/major_components/?stats=' + _get_stats()).then(function (prom) {
        var major_components = [];
        if (typeof prom.data == 'object') {
          major_components = _sort_major_components(prom.data);
        }
        $scope.majorComponentsTableParams = new NgTableParams({sorting: {oe_part_number_sort_field: "asc"}}, {dataset: major_components});
      });


      $http.get('/attrsreader/product/' + sku + '/service_kits/?stats=' + _get_stats()).then(function (prom) {
        var service_kits = [];
        if (typeof prom.data == 'object') {
          service_kits = prom.data;
        }
        $scope.serviceKitsTableParams = new NgTableParams({}, {dataset: service_kits});
      });

      $http.get('/attrsreader/product/' + sku + '/interchanges/?stats=' + _get_stats()).then(function (prom) {
        var interchanges = []
        if (typeof prom.data == 'object')
          interchanges = prom.data;

        $scope.interchangeTableParams = new NgTableParams({}, {dataset: interchanges});
      });

      $http.get('/attrsreader/product/' + sku + '/sales_notes/').then(function (prom) {
        var sales_notes = []
        if (typeof prom.data == 'object')
          sales_notes = prom.data;
        $scope.has_notes = sales_notes.length > 0;
        $scope.salesnotesTableParams = new NgTableParams({}, {dataset: sales_notes});
      });

      function init_batches(cols) {
        var skus = get_matrix_skus(cols.slice(3));
        return $http.post('/attrsreader/product/sales_notes/', skus).then(function (promise) {
          console.log(promise.data);
          $scope.salesBatchnotesTableParams = new NgTableParams({sorting: {part_number: "asc"}}, {dataset: promise.data});
        })
      }

      $scope.init_gasket_turbo = function () {
        console.log("Gasket Turbo Rest");
        return $http.get('/attrsreader/product/' + sku + '/gasket_turbo/?stats=' + _get_stats()).then(function (prom) {
          var turbo_gaskets = [];
          if (typeof prom.data == 'object' && prom.data.hasOwnProperty('part_number')) {
            turbo_gaskets.push(prom.data);
            process_turbos_interchanges(turbo_gaskets);
          }
          $scope.turboGaskeKitTableParams = new NgTableParams({}, {dataset: turbo_gaskets});
        });
      };

      $scope.init_standard_oversize = function () {
        console.log("Standard Oversize Rest");
        return $http.get('/attrsreader/product/' + sku + '/standard_oversize/').then(function (prom) {
          var std_ovrs = [];
          if (typeof prom.data == 'object') {
            std_ovrs = prom.data.table;
            $scope.original_part = prom.data.original_part || false;
            $scope.std_reference = prom.data.reference;
            make_flat_interchanges(std_ovrs);
          }
          $scope.standardOversizeTableParams = new NgTableParams({
            sorting: {maxOuterDiameter: "asc"},
            count: 50
          }, {dataset: std_ovrs});
          $scope.originalPartTableParams = new NgTableParams({}, {dataset: [$scope.original_part]});
        });
      };

      $scope.init_gasket_kit = function () {
        console.log("Gasket Kit Rest");
        return $http.get('/attrsreader/product/' + sku + '/gasket_kit/?stats=' + _get_stats()).then(function (prom) {
          var gasket_kit_turbos = [];
          if (typeof prom.data == 'object') {
            gasket_kit_turbos = prom.data;
            process_turbos_interchanges(gasket_kit_turbos);
          }
          $scope.gasketKitTurbosTableParams = new NgTableParams({}, {dataset: gasket_kit_turbos});
        });
      }

      $scope.init_kit_matrix = function () {
        return $http.get('/attrsreader/product/' + sku + '/kit_matrix/').then(function (prom) {
          if (typeof prom.data == 'object') {
            $scope.kit_matrix = KitMatrixService.hash2array(prom.data[0]);
            $scope.cols = KitMatrixService.modifyHeaders(prom.data[1]);
            $scope.cols = KitMatrixService.sortByKey($scope.cols, 'title');
            $scope.kit_matrix = KitMatrixService.sortByKey($scope.kit_matrix, 'part_number');
            return init_batches($scope.cols)
          } else {
            $scope.cols = [];
          }

        });
      }
    }

    function create_interchanges_filter(interchanges) {
      if (interchanges) {
        return interchanges.map(function (current) {
          keys = Object.keys(current)
          return current[keys[0]];
        })
      }
    }

    function _process_also_boughts(items) {
      return items.map(function (item) {
        item.interchanges_flat = create_interchanges_filter(item.interchanges)
        return item
      })
    }

    $scope.initAlsoBought = function () {
      var sku = $routeParams.sku;
      $http.get("/customer/product/" + sku + "/also_bought/").then(function (promise) {
        $scope.also_bought =   new NgTableParams({}, {dataset: _process_also_boughts(promise.data)})
      })
    }

    $scope.$on('currencyChanged', function (event, args) {
      console.log("Currency Changed" + SKU);
      _get_price($rootScope.price_sku).then(function (promise) {
        $scope.authorised = promise[0];
        $scope.price = promise[1];
      });

    });

    $scope.hasNotes = function () {
      return $scope.has_notes;
    };

    $scope.seeMoreNotes = function () {
      $scope.tab = 7;
    };
  }
)
