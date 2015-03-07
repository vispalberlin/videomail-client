var AudioSample = require('./items/sample'),

    audioContext

module.exports = function(rawVisualUserMedia, options) {

    var recordAudio        = false,
        paused             = false,
        recorder

    function initAudio(localMediaStream, onAudioSample) {

        // instantiate only once
        if (!audioContext)
            audioContext = new AudioContext()

        // creates an audio node from the microphone incoming stream
        var audioInput = audioContext.createMediaStreamSource(localMediaStream),
            volume     = audioContext.createGain()

        // set recording volume to max (0 .. 1)
        volume.gain.value = .9

        /*
        From the spec: This value controls how frequently the audioprocess event is
        dispatched and how many sample-frames need to be processed each call.
        Lower values for buffer size will result in a lower (better) latency.
        Higher values will be necessary to avoid audio breakup and glitches
        */
        var bufferSize = 2048 // remember it needs to be a power of two

        // Create a ScriptProcessorNode with the given bufferSize and a single input and output channel
        recorder = audioContext.createScriptProcessor(bufferSize, 1, 1)

        recorder.onaudioprocess = function(e) {
            if (!recordAudio|| paused)
                return

            // Returns a Float32Array containing the PCM data associated with the channel,
            // defined by the channel parameter (with 0 representing the first channel)
            var float32Array = e.inputBuffer.getChannelData(0)
            onAudioSample(new AudioSample(float32Array))
        }

        // connect stream to our recorder
        audioInput.connect(recorder)

        // connect our recorder to the previous destination
        recorder.connect(audioContext.destination)

        // connect volume
        audioInput.connect(volume)
        volume.connect(recorder)
    }

    function setVisualStream(localMediaStream) {
        if (rawVisualUserMedia) {

            if (localMediaStream) {
                rawVisualUserMedia.srcObject = localMediaStream
                rawVisualUserMedia.src = (window.URL && window.URL.createObjectURL(localMediaStream)) || localMediaStream
            } else {
                rawVisualUserMedia.srcObject = null
                rawVisualUserMedia.removeAttribute('src')
            }
        }
    }

    function getVisualStream() {
        return  rawVisualUserMedia.mozSrcObject ?
                rawVisualUserMedia.mozSrcObject :
                rawVisualUserMedia.srcObject
    }

    this.init = function(localMediaStream, onplaying, onAudioSample) {

        rawVisualUserMedia.onloadedmetadata = function() {
            // just temporary
            options.debug('UserMedia: onloadedmetadata')

            rawVisualUserMedia.play()
        }

        window.addEventListener('loadedmetadata', function() {
            // just temporary
            options.debug('UserMedia: loadedmetadata 2')
        }, true)

        // making sure we're calling it just once
        rawVisualUserMedia.onplaying = function() {
            // just temporary
            options.debug('UserMedia: onplaying')

            rawVisualUserMedia.onplaying = null
            onplaying()
        }

        rawVisualUserMedia.addEventListener('playing', function() {
            // just temporary
            options.debug('UserMedia: onplaying 2')
        }, false)

        rawVisualUserMedia.onplay = function() {
            // just temporary
            options.debug('UserMedia: onplay')
        }

        rawVisualUserMedia.oncanplay = function() {
            // just temporary
            options.debug('UserMedia: oncanplay')
        }

        rawVisualUserMedia.onreadystatechange = function() {
            // just temporary
            options.debug('UserMedia: onreadystatechange', arguments)
        }

        setVisualStream(localMediaStream)

        rawVisualUserMedia.autoplay = 'autoplay'

        options.audio.enabled &&
        onAudioSample &&
        initAudio(localMediaStream, onAudioSample)
    }

    this.isReady = function() {
        return !!rawVisualUserMedia.src
    }

    this.stop = function() {
        var visualStream = getVisualStream()

        if (visualStream) {
            visualStream.stop && visualStream.stop()

            setVisualStream(null)
        }

        paused = recordAudio  = false

        if (recorder)
            recorder.onaudioprocess = undefined
    }

    this.pause = function() {
        paused = true
    }

    this.isPaused = function() {
        return paused
    }

    this.resume = function() {
        paused = false
    }

    this.hasNoDimensions = function() {
        // Chrome has a height of 2px for videos without streams
        return rawVisualUserMedia.videoWidth < 3 || rawVisualUserMedia.videoHeight < 3
    }

    this.getRawVisuals = function() {
        return rawVisualUserMedia
    }

    this.createCanvas = function() {
        var canvas = document.createElement('canvas')

        canvas.width  = rawVisualUserMedia.width  || rawVisualUserMedia.clientWidth
        canvas.height = rawVisualUserMedia.height || rawVisualUserMedia.clientHeight

        return canvas
    }

    this.recordAudio = function() {
        recordAudio = true
    }

    this.getAudioSampleRate = function() {
        return audioContext.sampleRate
    }
}
