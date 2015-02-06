var merge           = require('merge-recursive'),
    async           = require('async'),

    Container       = require('./wrappers/container'),

    VideomailError  = require('./util/videomailError'),
    Browser         = require('./util/browser'),
    standardize     = require('./util/standardize'),

    browser         = new Browser()

// todo: consider using a web component instead!

function factory() {

    return {
        globalOptions: {
            logger:                 console,                // define logging instance
            debug:                  false,                  // set true to log more info
            timeout:                5000,                   // increase if connection is slow
            baseUrl:                'https://videomail.io', // leave as it, permanent url to post videos
            socketUrl:              'wss://videomail.io',   // leave as it, permanent url to send frames
            siteName:               'videomail-client-demo',// Required for the API. If you change it, contact me
            reconnect:              true,                   // automatically reconnects
            cache:                  true,                   // reduces GET queries when loading videos
            insertCss:              true,                   // inserts predefined CSS, see examples
            enablePause:            true,                   // enable pause/resume button
            enableAutoPause:        true,                   // automatically pauses when window becomes inactive
            enableSpace:            true,                   // hitting space can pause recording
            disableSubmit:          false,                  // set this to true if you do not want to submit videos,
                                                            // but just want to record and replay these temporarily
            enableAutoValidation:   true,                   // automatically validates all form inputs if any exist

            selectors: {                                    // default CSS selectors you can alter, see examples
                containerId:    'videomail',
                replayClass:    'replay',
                userMediaClass: 'userMedia',
                visualsClass:   'visuals',
                buttonsClass:   'buttons',

                recordButtonClass: 'record',
                pauseButtonClass:  'pause',
                resumeButtonClass: 'resume',
                stopButtonClass:   'stop',
                backButtonClass:   'back',
                submitButtonClass: 'submit',

                submitButtonId:    'submitBtn',
                formId:            null
            },
            audio: {
                enabled: false                              // experimental, not working properly yet
            },
            video: {
                fps:            15,                         // depends on your connection
                limitSeconds:   30,                         // recording automatically stops after that limit
                countdown:      3,                          // set it to 0 or false to disable it
                width:          320,
                height:         240
            },
            image: {
                quality:    .5,
                types:      ['webp', 'jpeg']                // recommended settings to make most of all browsers
            },
            text: {
                paused:         'Paused',                   // alter these text if you have internationalisation
                processing:     'Processing',
                limitReached:   'Limit reached'
            },
            notifier: {
                entertain:         false,                   // when true, user is entertained while waiting, see examples
                entertainClass:    'bg',
                entertainLimit:    7,
                entertainInterval: 15000
            }
        },

        setGlobalOptions: function(newGlobalOptions) {
            this.globalOptions = merge.recursive(this.globalOptions, newGlobalOptions)
        },

        getOptions: function(localOptions) {
            localOptions = merge.recursive(this.globalOptions, localOptions || {})

            if (localOptions.debug)
                localOptions.debug = localOptions.logger.debug.bind(localOptions.logger)
            else
                localOptions.debug = function() {}

            return localOptions
        },

        init: function(localOptions, cb) {

            if (!cb && typeof localOptions === 'function') {
                cb           = localOptions
                localOptions = this.getOptions()
            } else
                localOptions = this.getOptions(localOptions)

            if (!cb)
                 cb = function(err) {
                    err && localOptions.logger.error(err)
                 }

            async.series({
                controller: function(cb) {
                    var container = new Container(localOptions)
                    container.build(cb)
                },

                videomail: function(cb) {
                    if (localOptions.load)
                        Videomail.get(localOptions.load, localOptions, cb)
                    else
                        cb()
                }

            }, function(err, results) {
                if (err) {
                    results.controller.unload(err)
                    cb(err)
                } else {
                    cb(null, results.controller, results.videomail)
                }
            })
        },

        // todo: remove later
        canRecord: function() {
            return browser.canRecord()
        },

        // todo: remove later
        createError: function(err) {
            return VideomailError.create(err)
        }
    }
}

// UMD (Universal Module Definition)
// Inspired by https://github.com/es-shims/es5-shim
;(function(navigator, factory) {
    standardize(this, navigator)

    this.Videomail = factory()

    if (typeof exports === 'object')
        module.exports = this.Videomail

}(navigator, factory))
