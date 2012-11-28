# monconn
parse and use mongodb connectionstrings

## Installation

    $ npm install monconn

## Usage

    var monconn = require('monconn');

    a = monconn.parse('mongodb:localhost/testDB');

    a.db; 	// 'testDB'
    a.host; // 'localhost'

Use in conjunction with `mongodb` native driver:

    a.connect(require('mongodb'), function (err, db) {
    	// do what you like with your connected db object
    });

## Limitations

Currently doesn't do anything with querystring options.

## License
MIT. (c) 2012 jden - Jason Denizac <jason@denizac.org>