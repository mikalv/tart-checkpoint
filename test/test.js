/*

test.js - checkpoint configuration test

The MIT License (MIT)

Copyright (c) 2013 Dale Schumacher, Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var tart = require('../index.js');

var test = module.exports = {};

test['readme example processes two messages'] = function (test) {
    test.expect(3);
    var checkpoint = tart.checkpoint();
    
    var testFixture = checkpoint.domain.sponsor(function (message) {
        if (message.step === 'end') {
            test.done();  // test completion
        } else if (message.step === 'foo') {
            test.equal(message.value, 'foo');
            this.self({ step:'end' });
        } else if (message.step === 'bar') {
            test.equal(message.value, 'bar');
            test.strictEqual(message.path, require('path'));
        } else {
            test.assert(false);  // should not be called
        }
    });

    var oneTimeBeh = "function oneTimeBeh(message) {"
        + "this.state.test({ step:'bar', value:message, path:require('path') });"
        + "var actor = this.sponsor(this.state.createdBeh, this.state);"
        + "actor('foo');"
        + "this.behavior = this.state.becomeBeh;"
    + "}";

    var sharedState = {
        createdBeh: "function createdBeh(message) {"
            + "this.state.test({ step:'foo', value:message });"
        + "}",
        becomeBeh: "function becomeBeh(message) {"
            + "this.state.test({ step:'fail', value:message });"
        + "}",
        test: testFixture
    };
    
    var actor = checkpoint.sponsor(oneTimeBeh, sharedState);
    actor('bar');
};

test['checkpoint actor communicates with "remote" test domain'] = function (test) {
    test.expect(2);
    var checkpoint = tart.checkpoint();

    var remote = checkpoint.router.domain('remote');
    var testFixture = remote.sponsor(function (message) {
        if (message.step === 'end') {
            test.done();  // test completion
        } else if (message.step === 'foo') {
            test.equal(message.value, 'foo');
            this.self({ step:'end' });
        } else if (message.step === 'bar') {
            test.equal(message.value, 'bar');
        } else {
            test.assert(false);  // should not be called
        }
    });

    var oneTimeBeh = "function oneTimeBeh(message) {"
        + "this.state.test({ step:'bar', value:message });"
        + "var actor = this.sponsor(this.state.createdBeh, this.state);"
        + "actor('foo');"
        + "this.behavior = require('./beh_lib.js').became;"
    + "}";

    var remoteState = {
        createdBeh: "function createdBeh(message) {"
            + "this.state.test({ step:'foo', value:message });"
        + "}",
        test: testFixture
    };
    var json = remote.encode(remoteState);
    console.log('encodedState:', json);
    var localState = checkpoint.domain.decode(json);
    
    var actor = checkpoint.sponsor(oneTimeBeh, localState);
    actor('bar');
};
