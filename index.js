process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var soap = require('soap');
var Benchmark = require('benchmark');
var Q = require('q');
var urlV2 = 'http://magento.local/index.php/api/v2_soap/?wsdl=1';
var urlV1 = 'http://magento.local/index.php/api/soap/?wsdl=1';

var deferred = Q.defer();
var clientv1;
var clientv2;

function login() {

    var loginArgs = {
        username : 'mark',
        apiKey : 'asdfasdf'
    };

    soap.createClient(urlV2, function (err, client) {
        clientv2 = client;
        client.login(loginArgs, function (err, result) {
            if (err) {
                deferred.reject(new Error("Error getting token"));
            }
            var sessionId = result.result;
            deferred.resolve(sessionId);
        });
    });

    soap.createClient(urlV1, function (err, client) {
        clientv1 = client;
    });
    return deferred.promise;
}

function createV1Client() {

    var deferred = Q.defer();

    soap.createClient(urlV1, function(err, client){
        if (err) {
            deferred.reject(new Error("ERROR Creating client at " + url));
        }
        clientv1 = client;
        deferred.resolve();
    });
    return deferred.promise;
}


function createV2Client() {

    var deferred = Q.defer();

    soap.createClient(urlV2, function(err, client){
        if (err) {
            deferred.reject(new Error("ERROR Creating client at " + url));
        }
        clientv2 = client;
        deferred.resolve();
    });
    return deferred.promise;
}

login()
    .then(createV1Client())
    .then(createV2Client())
    .then(function(sessionId) {

    var suite = new Benchmark.Suite;

    suite.add('v1', {
        fn: function(deferred) {

            var args = {
                sessionId : sessionId
            };

            clientv2.salesOrderList(args, function (err, result) {
                if (err) {
                    throw err;
                }

                deferred.resolve();
            })

        },
        defer: true,
        async : true,
        onComplete : function() {
            console.log("********** V2 stats\n **********\n")
            console.log(this.stats)
        }
    });


    suite.add('v2', {
            fn: function(deferred) {

                clientv1.call({sessionId: sessionId, resourcePath: "sales_order.list", args : [] }, function (err, result) {
                    if (err) {
                        throw err;
                    }
                    deferred.resolve();
                });

            },
            defer: true,
            async : true,
            onComplete : function() {
                console.log("********** V1 stats **********\n")
                console.log(this.stats)}

        });

    suite.on('complete', function() {
            console.log('Fastest is ' + this.filter('fastest').pluck('name'))}
    );

    suite.run({async:true});

});
