/*!
 * MediaElement.js
 * http://www.mediaelementjs.com/
 *
 * Wrapper that mimics native HTML5 MediaElement (audio and video)
 * using a variety of technologies (pure JavaScript, Flash, iframe)
 *
 * Copyright 2010-2017, John Dyer (http://j.hn/)
 * License: MIT
 *
 */(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
'use strict';

mejs.i18n.en['mejs.a11y-video-description'] = 'Toggle sign language';
mejs.i18n.en['mejs.a11y-audio-description'] = 'Toggle audio description';

Object.assign(mejs.MepDefaults, {
    videoDescriptionToggled: false,

    audioDescriptionToggled: false,

    defaultSource: null,

    audioDescriptionSource: null,

    videoDescriptionSource: null,

    isPlaying: false,

    isVoiceover: false
});

Object.assign(MediaElementPlayer.prototype, {
    builda11y: function builda11y() {
        var t = this;

        t.options.defaultSource = this.node.src;
        t.options.audioDescriptionSource = t._loadSourceFromAttribute('data-audio-description');
        t.options.videoDescriptionSource = t._loadSourceFromAttribute('data-video-description');

        if (t.options.audioDescriptionSource) t._createAudioDescription();
        if (t.options.videoDescriptionSource) t._createVideoDescription();

        t.node.addEventListener('play', function () {
            return t.options.isPlaying = true;
        });
        t.node.addEventListener('playing', function () {
            return t.options.isPlaying = true;
        });
        t.node.addEventListener('pause', function () {
            return t.options.isPlaying = false;
        });
        t.node.addEventListener('ended', function () {
            return t.options.isPlaying = false;
        });
    },
    _createAudioDescription: function _createAudioDescription() {
        var t = this;

        var audioDescriptionTitle = mejs.i18n.t('mejs.a11y-audio-description');
        var audioDescriptionButton = document.createElement('div');
        audioDescriptionButton.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'audio-description-button';
        audioDescriptionButton.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + audioDescriptionTitle + '" aria-label="' + audioDescriptionTitle + '" tabindex="0"></button>';

        t.addControlElement(audioDescriptionButton, 'audio-description');

        audioDescriptionButton.addEventListener('click', function () {
            t.options.audioDescriptionToggled = !t.options.audioDescriptionToggled;
            mejs.Utils.toggleClass(audioDescriptionButton, 'audio-description-on');

            t._toggleAudioDescription();
        });
    },
    _createVideoDescription: function _createVideoDescription() {
        var t = this;
        var videoDescriptionTitle = mejs.i18n.t('mejs.a11y-video-description');
        var videoDescriptionButton = document.createElement('div');
        videoDescriptionButton.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'video-description-button';
        videoDescriptionButton.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + videoDescriptionTitle + '" aria-label="' + videoDescriptionTitle + '" tabindex="0"></button>';
        t.addControlElement(videoDescriptionButton, 'video-description');

        videoDescriptionButton.addEventListener('click', function () {
            t.options.videoDescriptionToggled = !t.options.videoDescriptionToggled;
            mejs.Utils.toggleClass(videoDescriptionButton, 'video-description-on');

            t._toggleVideoDescription();
        });
    },
    _loadSourceFromAttribute: function _loadSourceFromAttribute(attribute) {
        var t = this;
        if (!t.node.hasAttribute(attribute)) return null;

        var sources = null;
        var json = void 0;

        try {
            var data = t.node.getAttribute(attribute);
            json = JSON.parse(data);
        } catch (error) {
            console.error('error loading ' + attribute + ': ' + error.message);
        } finally {
            sources = json;
        }

        return sources ? this._evaluateBestMatchingSource(sources) : null;
    },
    _evaluateBestMatchingSource: function _evaluateBestMatchingSource(sourceArray) {
        var _this = this;

        var canPlayType = function canPlayType(type) {
            return _this.node.canPlayType(type);
        };

        var propablySources = sourceArray.filter(function (file) {
            return canPlayType(file.type) === 'probably';
        });
        if (propablySources.length > 0) return propablySources[0].src;

        var alternativeSources = sourceArray.filter(function (file) {
            return canPlayType(file.type) === 'maybe';
        });
        if (alternativeSources.length > 0) return alternativeSources[0].src;

        return null;
    },
    _createAudioDescriptionPlayer: function _createAudioDescriptionPlayer() {
        console.log('creating audio player');
        var t = this;

        var audioNode = document.createElement('audio');
        audioNode.setAttribute('src', t.options.audioDescriptionSource);
        audioNode.setAttribute('preload', 'metadata');
        audioNode.setAttribute('playsinline', '');
        audioNode.setAttribute('controls', '');
        document.body.appendChild(audioNode);
        audioNode.load();
        audioNode.muted = true;

        audioNode.play().then(function () {
            t.audioDescriptionNode.currentTime = t.node.currentTime;
            if (!t.options.isPlaying) audioNode.pause();
        }).catch(function (e) {
            return console.error(e);
        });

        t.audioDescriptionNode = audioNode;

        audioNode.addEventListener('loadeddata', function () {
            return console.info('loadeddata');
        });
        audioNode.addEventListener('loadstart', function () {
            return console.info('loadstart');
        });

        t.node.addEventListener('play', function () {
            t.audioDescriptionNode.currentTime = t.node.currentTime;
            var promise = t.audioDescriptionNode.play();
            promise.catch(function (e) {
                return console.error(e);
            });
        });
        t.audioDescriptionNode.addEventListener('play', function () {
            return t.audioDescriptionNode.currentTime = t.node.currentTime;
        });
        t.node.addEventListener('seeked', function () {
            return t.audioDescriptionNode.currentTime = t.node.currentTime;
        });
        t.node.addEventListener('pause', function () {
            return t.audioDescriptionNode.pause();
        });
        t.node.addEventListener('ended', function () {
            return t.audioDescriptionNode.pause();
        });
    },
    _toggleAudioDescription: function _toggleAudioDescription() {
        var t = this;

        if (!t.audioDescriptionNode) t._createAudioDescriptionPlayer();

        if (t.options.audioDescriptionToggled) {
            t.audioDescriptionNode.volume = t.node.volume;
            t.node.muted = true;
            t.audioDescriptionNode.muted = false;
            if (t.options.isPlaying) t.audioDescriptionNode.play().catch(function (e) {
                return console.error(e);
            });
        } else {
            t.audioDescriptionNode.muted = true;
            t.node.muted = false;
            t.audioDescriptionNode.pause();
        }
    },
    _toggleVideoDescription: function _toggleVideoDescription() {
        var t = this;
        var currentTime = t.node.currentTime;
        var wasPlaying = t.options.isPlaying;
        var active = t.options.videoDescriptionToggled;

        t.node.pause();

        t.node.setSrc(active ? t.options.videoDescriptionSource : t.options.defaultSource);

        t.node.load();
        t.node.setCurrentTime(currentTime);

        if (wasPlaying) t.node.play();
    }
});

},{}]},{},[1]);
