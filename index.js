'use strict';

var dns = require('dns');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var irc = require('irc');
var bs58 = require('bs58check');


function IRC(channel, localAddress, localPort) {
    EventEmitter(this);

    // Get an IRC channel to use to bootstrap
    this._channel = channel;

    // Encode our address as a nickname
    var nickname = IRC.addressToNickname(localAddress, localPort);

    // users has the currently found list; _nextUsers has the new list we are building
    this.addresses = [];
    this._nextAddresses = null;

    // Whether we have ever had users
    this._foundAddresses = false;

    var self = this;

    this._client = new irc.Client('irc.lfnet.org', nickname, {
        channels: [this._channel],
    });

    // Listen to all messages, since the irc lib doesn't pay attention to WHO replies
    this._client.on('raw', function (message) {

        // We got a reply including a user
        // https://tools.ietf.org/html/rfc2812#section-5.1 (see: RPL_WHOREPLY)
        if (message.command == 'rpl_whoreply') {
            var address = IRC.nicknameToAddress(message.args[5]);
            if (address !== null) {
                self._nextAddresses.push(address);
            }

        // We have finished getting users
        } else if (message.command == 'rpl_endofwho') {

            // Sort the addresses
            self._nextAddresses.sort(function(a, b) {
                if (a.address < b.address) {
                    return -1;
                } else if (a.address > b.address) {
                    return 1
                }
                return (a.port - b.port);
            });

            // Did the data change?
            var changed = false;
            if (self._nextAddresses.length === self.addresses.length) {
                for (var i = 0; i < self.addresses.length; i++) {
                    var a = self.addresses[i], b = self._nextAddresses[i];
                    if (a.address != b.address || a.port != b.port) {
                        changed = true;
                        break;
                    }
                }
            } else {
                changed = true;
            }

            if (changed) {

                // Swap the new user data in
                self.addresses = self._nextAddresses;

                // If we actually have users, notify our listeners
                if (self.addresses.length) {

                    // Notify our listeners (either an update or initial found)
                    if (!self._foundAddresses) {
                        self.emit('found', self.addresses);
                        self._foundAddresses = true;

                        // Now we can throttle the query requests to 5 minutes
                        var oldTimer = self._timer;
                        self._timer = setInterval(self._query, 5 * 60 * 1000);
                        self._timer.unref();
                    }
                    self.emit('updated', self.addresses);
                }

            }

            // Let query have another go
            self._nextAddresses = null;
        }
    });

    // We trap this to prevent an error from killing th entire app
    this._client.on('error', function(error) {
        console.log('ERROR:', error);
    });

    // Send a query unless one already inflight
    this._query = function() {
        if (self._nextAddresses !== null) { return; }
        self._nextAddresses = []
        self._client.send('WHO', self._channel);
    }

    // Don't stay alive if the bootstrap is the only thing left
    this._client.on('connect', function() {
        self._client.conn.unref();
    });

    // First we query at 5s intervals, until we have some seeds, then back off to 5 minutes
    this._client.on('registered', function() {
        self._query();
        self._timer = setInterval(self._query, 5 * 1000);
        self._timer.unref();
    });
}
util.inherits(IRC, EventEmitter);


IRC.prototype.stop = function() {
    this._client.disconnect();
    clearInterval(this._timer);
    this._timer = null;
}

IRC.nicknameToAddress = function(username) {
    if (username.length == 0 || username[0] != 'u') {
        return null;
    }

    var address = null;

    try {
        var binaryData = bs58.decode(username.slice(1));

        var groups = []
        for (var i = 0; i < 4; i++) {
            groups.push(binaryData[i]);
        }

        address = {host: groups.join('.'), port: binaryData.readUInt16BE(4)}
    } catch (error) { }

    return address;
}


IRC.addressToNickname = function(host, port) {
    var binaryData = new Buffer(6);

    var groups = host.split('.');
    for (var i = 0; i < 4; i++) {
        binaryData.writeUInt8(groups[i], i);
    }

    binaryData.writeUInt16BE(port, 4);

    return 'u' + bs58.encode(binaryData);
}



function DNS(hosts, port) {

    var firstFound = false;

    this._addresses = {};

    for (var i = 0; i < hosts.length; i++) {
        var self = this;
        DNS.query(hosts[i], port, function(error, addresses) {
            if (addresses.length === 0) { return; }

            // Add the new addresses to our address set
            for (var i = 0; i < addresses.length; i++) {
                self._addresses[addresses[i]] = true;
            }

            // Notify as necessary
            if (firstFound) {
                firstFound = false;
                self.emit('found', Object.keys(self._addresses));
            }
            self.emit('updated', Object.keys(self._addresses));
        });
    }
}
util.inherits(DNS, EventEmitter);

// NOTE: The node.js getaddrinfo is quite limited, so we cannot (at this time)
//       actually get the port being advertised, so we will assume it to be
//       the same as the network port, which is usually the case anyways.
DNS.query = function(host, port, callback) {
    if (!callback) {
        throw new Error('queryDNS requires a callback');
    }

    var self = this;
    dns.resolve(host, function(error, addrs) {
        if (error) {
            return callback(error);
        }

        return callback(null, addrs);
    });
}


module.exports = {
    DNS: DNS,
    IRC: IRC,
}
