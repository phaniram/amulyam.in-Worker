              require('newrelic');
var cluster = require('cluster'); // Include the cluster module

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Create a worker 
    cluster.fork();

    // Listen for dying workers
    cluster.on('exit', function(worker) {

        // Replace the dead worker, we're not sentimental
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

    // Code to run if we're in a worker process
}
else {
    var http = require('http');
    (function() {
        "use strict";
        var request = require('request');
        var cheerio = require('cheerio');
        request = request.defaults({
            jar: true
        });
        var interval = 24 * 60 * 60 * 1000;

        var AMULYAM_USERNAME = process.env.AMULYAM_USERNAME;
        var AMULYAM_PASSWORD = process.env.AMULYAM_PASSWORD;
        var AMULYAM_LOGIN_URL = 'http://www.amulyam.in/login.do';
        var AMULYAM_HOME_URL = 'http://www.amulyam.in/';
        var AMULYAM_LOGOUT_URL = 'http://www.amulyam.in/logout.do';

        console.log("AMULYAM_USERNAME:" + AMULYAM_USERNAME);
        console.log("AMULYAM_PASSWORD:" + AMULYAM_PASSWORD);

        var dailyLoginWorker = function() {
            console.log("Trying to login now");
            request.post(AMULYAM_LOGIN_URL, {
                form: {
                    mobile: AMULYAM_USERNAME,
                    password: AMULYAM_PASSWORD
                }
            },

            function(error, response, html) {
                if (!error && response.statusCode == 200) {
                    console.log("Login SUCCESS");
                    request(AMULYAM_HOME_URL, function(err, resp, body) {
                        if (!err && resp.statusCode == 200) {
                            console.log("Gone to Home Page ");
                            var $ = cheerio.load(body);
                            $('span.balance').each(function(i, element) {
                                console.log("Balance : " + $(this).text());
                            });
                            request(AMULYAM_LOGOUT_URL, function(logout_error, logout_resp, logout_html) {
                                if (!logout_error && logout_resp.statusCode == 200) {
                                    console.log("Logged Out!");
                                }
                                else {
                                    console.log("Error navigating to " + AMULYAM_LOGOUT_URL + "  :   " + JSON.stringify(logout_error));
                                }
                            });
                        }
                        else {
                            console.log("Error navigating to " + AMULYAM_HOME_URL + "  :   " + JSON.stringify(err));
                        }
                    });
                }
                else {
                    console.log("Error navigating to " + AMULYAM_LOGIN_URL + "  :   " + JSON.stringify(error));
                }
            });
        };

        if (AMULYAM_USERNAME && AMULYAM_PASSWORD) {
            dailyLoginWorker();
            if (interval > 0) setInterval(dailyLoginWorker, interval);
        }
    })();
    var port = Number(process.env.PORT || 5000);
    http.createServer(function(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        res.end('Hello from Amulayam Daily Login Worker : '+cluster.worker.id);
    }).listen(port);
}