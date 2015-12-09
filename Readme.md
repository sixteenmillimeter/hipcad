
hipcad
========

hipcad is hypertext scriptable CAD

Look how easy it is to use:

    node hipcad.js


Features
--------

- Create and save scripts

Installation
------------

Install hipcad by running:

    sh install.sh

Contribute
----------

- Issue Tracker: github.com/hipcad/hipcad/issues
- Source Code: github.com/hipcad/hipcad

Support
-------

If you are having issues, please let us know.
We have a mailing list located at: project@google-groups.com

License
-------

The project is licensed under the MIT license.


Styleguide - Mark problem areas with TODO
----------

#1) For async functions.

var functionName = function ([params], callback) {
	'use strict';


	//err = null || err Object
	//data = undefined || Object with named key
	callback(err, data)	
};