cordova.define("cordova-plugin-local-notification.LocalNotification.Util", function(require, exports, module) {
/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 */

var exec    = require('cordova/exec'),
    channel = require('cordova/channel');

// Default values
exports._defaults = {
    actionGroupId : null,
    actions       : [],
    attachments   : [],
    autoClear     : true,
    badge         : null,
    channel       : null,
    color         : null,
    data          : null,
    defaults      : 0,
    foreground    : false,
    group         : null,
    groupSummary  : false,
    icon          : null,
    id            : 0,
    launch        : true,
    led           : true,
    lockscreen    : true,
    mediaSession  : null,
    number        : 0,
    priority      : 0,
    progressBar   : false,
    showWhen      : true,
    silent        : false,
    smallIcon     : 'res://icon',
    sound         : true,
    sticky        : false,
    summary       : null,
    text          : '',
    title         : '',
    trigger       : { type : 'calendar' },
    vibrate       : false,
    wakeup        : true
};

// Listener
exports._listener = {};

/**
 * Merge custom properties with the default values.
 *
 * @param [ Object ] options Set of custom values.
 *
 * @retrun [ Object ]
 */
exports.mergeWithDefaults = function (options) {
    var values = this.getDefaults();

    if (values.hasOwnProperty('sticky')) {
        options.sticky = this.getValueFor(options, 'sticky', 'ongoing');
    }

    if (options.sticky && options.autoClear !== true) {
        options.autoClear = false;
    }

    Object.assign(values, options);

    for (var key in values) {
        if (values[key] !== null) {
            options[key] = values[key];
        } else {
            delete options[key];
        }

        if (!this._defaults.hasOwnProperty(key)) {
            console.warn('Unknown property: ' + key);
        }
    }

    options.meta = {
        plugin:  'cordova-plugin-local-notifications',
        version: '0.9-beta'
    };

    return options;
};

/**
 * Convert the passed values to their required type.
 *
 * @param [ Object ] options Properties to convert for.
 *
 * @return [ Object ] The converted property list
 */
exports.convertProperties = function (options) {
    var parseToInt = function (prop, options) {
        if (isNaN(options[prop])) {
            console.warn(prop + ' is not a number: ' + options[prop]);
            return this._defaults[prop];
        } else {
            return Number(options[prop]);
        }
    };

    if (options.id) {
        options.id = parseToInt('id', options);
    }

    if (options.title) {
        options.title = options.title.toString();
    }

    if (options.badge) {
        options.badge = parseToInt('badge', options);
    }

    if (options.priority) {
        options.priority = parseToInt('priority', options);
    }

    if (options.foreground === true) {
        options.priority = Math.max(options.priority, 1);
    }

    if (options.foreground === false) {
        options.priority = Math.min(options.priority, 0);
    }

    if (options.defaults) {
        options.defaults = parseToInt('defaults', options);
    }

    if (options.smallIcon && !options.smallIcon.match(/^res:/)) {
        console.warn('Property "smallIcon" must be of kind res://...');
    }

    options.data = JSON.stringify(options.data);

    this.convertTrigger(options);
    this.convertActions(options);
    this.convertProgressBar(options);

    return options;
};

/**
 * Convert the passed values to their required type, modifying them
 * directly for Android and passing the converted list back for iOS.
 *
 * @param [ Map ] options Set of custom values.
 *
 * @return [ Map ] Interaction object with category & actions.
 */
exports.convertActions = function (options) {
    var actions = [];

    if (!options.actions)
        return null;

    for (var action of options.actions) {

        if (!action.id) {
            console.warn('Action with title ' + action.title + ' ' +
                         'has no id and will not be added.');
            continue;
        }

        action.id = action.id.toString();

        actions.push(action);
    }

    options.actions = actions;

    return options;
};

/**
 * Convert the passed values for the trigger to their required type.
 *
 * @param [ Map ] options Set of custom values.
 *
 * @return [ Map ] Interaction object with trigger spec.
 */
exports.convertTrigger = function (options) {
    var trigger  = options.trigger || {},
        date     = this.getValueFor(trigger, 'at', 'firstAt', 'date');

    var dateToNum = function (date) {
        var num = typeof date == 'object' ? date.getTime() : date;
        return Math.round(num);
    };

    if (!options.trigger)
        return;

    if (!trigger.type) {
        trigger.type = trigger.center ? 'location' : 'calendar';
    }

    var isCal = trigger.type == 'calendar';

    if (isCal && !date) {
        date = this.getValueFor(options, 'at', 'firstAt', 'date');
    }

    if (isCal && !trigger.every && options.every) {
        trigger.every = options.every;
    }

    if (isCal && (trigger.in || trigger.every)) {
        date = null;
    }

    if (isCal && date) {
        trigger.at = dateToNum(date);
    }

    if (isCal && trigger.firstAt) {
        trigger.firstAt = dateToNum(trigger.firstAt);
    }

    if (isCal && trigger.before) {
        trigger.before = dateToNum(trigger.before);
    }

    if (isCal && trigger.after) {
        trigger.after = dateToNum(trigger.after);
    }

    if (!trigger.count && device.platform == 'windows') {
        trigger.count = trigger.every ? 5 : 1;
    }

    if (!isCal) {
        trigger.notifyOnEntry = !!trigger.notifyOnEntry;
        trigger.notifyOnExit  = trigger.notifyOnExit === true;
        trigger.radius        = trigger.radius || 5;
        trigger.single        = !!trigger.single;
    }

    if (!isCal || trigger.at) {
        delete trigger.every;
    }

    delete options.every;
    delete options.at;
    delete options.firstAt;
    delete options.date;

    options.trigger = trigger;

    return options;
};

/**
 * Convert the passed values for the progressBar to their required type.
 *
 * @param [ Map ] options Set of custom values.
 *
 * @return [ Map ] Interaction object with trigger spec.
 */
exports.convertProgressBar = function (options) {
    var isAndroid = device.platform == 'Android',
        cfg       = options.progressBar;

    if (cfg === undefined)
        return;

    if (typeof cfg === 'boolean') {
        cfg = options.progressBar = { enabled: cfg };
    }

    if (typeof cfg.enabled !== 'boolean') {
        cfg.enabled = !!(cfg.value || cfg.maxValue || cfg.indeterminate !== null);
    }

    cfg.value = cfg.value || 0;

    if (isAndroid) {
        cfg.maxValue      = cfg.maxValue || 100;
        cfg.indeterminate = !!cfg.indeterminate;
    }

    cfg.enabled = !!cfg.enabled;

    return options;
};

/**
 * Create a callback function to get executed within a specific scope.
 *
 * @param [ Function ] fn    The function to be exec as the callback.
 * @param [ Object ]   scope The callback function's scope.
 *
 * @return [ Function ]
 */
exports.createCallbackFn = function (fn, scope) {

    if (typeof fn != 'function')
        return;

    return function () {
        fn.apply(scope || this, arguments);
    };
};

/**
 * Convert the IDs to numbers.
 *
 * @param [ Array ] ids
 *
 * @return [ Array<Number> ]
 */
exports.convertIds = function (ids) {
    var convertedIds = [];

    for (var id of ids) {
        convertedIds.push(Number(id));
    }

    return convertedIds;
};

/**
 * First found value for the given keys.
 *
 * @param [ Object ]         options Object with key-value properties.
 * @param [ *Array<String> ] keys    List of keys.
 *
 * @return [ Object ]
 */
exports.getValueFor = function (options) {
    var keys = Array.apply(null, arguments).slice(1);

    for (var key of keys) {
        if (options.hasOwnProperty(key)) {
            return options[key];
        }
    }

    return null;
};

/**
 * Convert a value to an array.
 *
 * @param [ Object ] obj Any kind of object.
 *
 * @return [ Array ] An array with the object as first item.
 */
exports.toArray = function (obj) {
    return Array.isArray(obj) ? Array.from(obj) : [obj];
};

/**
 * Fire the event with given arguments.
 *
 * @param [ String ] event The event's name.
 * @param [ *Array]  args  The callback's arguments.
 *
 * @return [ Void]
 */
exports.fireEvent = function (event) {
    var args     = Array.apply(null, arguments).slice(1),
        listener = this._listener[event];

    if (!listener)
        return;

    if (args[0] && typeof args[0].data === 'string') {
        args[0].data = JSON.parse(args[0].data);
    }

    for (var i = 0; i < listener.length; i++) {
        var fn    = listener[i][0],
            scope = listener[i][1];

        fn.apply(scope, args);
    }
};

/**
 * Execute the native counterpart.
 *
 * @param [ String ]  action   The name of the action.
 * @param [ Array ]   args     Array of arguments.
 * @param [ Function] callback The callback function.
 * @param [ Object ] scope     The scope for the function.
 *
 * @return [ Void ]
 */
exports.exec = function (action, args, callback, scope) {
    var fn     = this.createCallbackFn(callback, scope),
        params = [];

    if (Array.isArray(args)) {
        params = args;
    } else if (args) {
        params.push(args);
    }

    exec(fn, null, 'LocalNotification', action, params);
};

exports.setLaunchDetails = function () {
    exports.exec('launch', null, function (details) {
        if (details) {
            cordova.plugins.notification.local.launchDetails = details;
        }
    });
};

// Called after 'deviceready' event
channel.deviceready.subscribe(function () {
    if (['Android', 'windows', 'iOS'].indexOf(device.platform) > -1) {
        exports.exec('ready');
    }
});

// Called before 'deviceready' event
channel.onCordovaReady.subscribe(function () {
    channel.onCordovaInfoReady.subscribe(function () {
        if (['Android', 'windows', 'iOS'].indexOf(device.platform) > -1) {
            exports.setLaunchDetails();
        }
    });
});

});
