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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

        t.options.defaultSource = t.node.src;
        t.options.isVoiceover = t._loadBooleanFromAttribute('data-audio-description-voiceover');
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
    _getFirstChildNodeByClassName: function _getFirstChildNodeByClassName(parentNode, className) {
        return [].concat(_toConsumableArray(parentNode.childNodes)).find(function (node) {
            return node.className.indexOf(className) > -1;
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
    _loadBooleanFromAttribute: function _loadBooleanFromAttribute(attribute) {
        var t = this;
        if (!t.node.hasAttribute(attribute)) return false;

        var boolValue = t.node.getAttribute(attribute);
        return boolValue === 'true' || boolValue === '';
    },
    _evaluateBestMatchingSource: function _evaluateBestMatchingSource(sourceArray) {
        var _this = this;

        var getMimeFromType = function getMimeFromType(type) {
            return mejs.Utils.getMimeFromType(type);
        };
        var canPlayType = function canPlayType(type) {
            return _this.node.canPlayType(type);
        };

        var propablySources = sourceArray.filter(function (file) {
            return canPlayType(getMimeFromType(file.type)) === 'probably';
        });
        if (propablySources.length > 0) return propablySources[0].src;

        var alternativeSources = sourceArray.filter(function (file) {
            return canPlayType(getMimeFromType(file.type)) === 'maybe';
        });
        if (alternativeSources.length > 0) return alternativeSources[0].src;

        return null;
    },
    _createAudioDescriptionPlayer: function _createAudioDescriptionPlayer() {
        var t = this;

        var audioNode = document.createElement('audio');
        audioNode.setAttribute('src', t.options.audioDescriptionSource);
        audioNode.classList.add(t.options.classPrefix + 'audio-description-player');
        audioNode.load();
        document.body.appendChild(audioNode);

        t.audioDescription = new mejs.MediaElementPlayer(audioNode, {
            features: ['volume'],
            audioVolume: t.options.videoVolume,
            startVolume: t.node.volume,
            pauseOtherPlayers: false
        });

        t._bindAudioDescriptionEvents();

        if (!t.options.isVoiceover) {
            var volumeButtonClass = t.options.classPrefix + 'volume-button';
            var videoVolumeButton = t._getFirstChildNodeByClassName(t.controls, volumeButtonClass);
            t.videoVolumeButton = videoVolumeButton;

            if (videoVolumeButton) {
                var descriptiveVolumeButton = t._getFirstChildNodeByClassName(t.audioDescription.controls, volumeButtonClass);
                videoVolumeButton.classList.add('hidden');
                t.controls.insertBefore(descriptiveVolumeButton, videoVolumeButton.nextSibling);
                t.descriptiveVolumeButton = descriptiveVolumeButton;
            }
        }
    },
    _bindAudioDescriptionEvents: function _bindAudioDescriptionEvents() {
        var t = this;

        t.node.addEventListener('play', function () {
            return t.audioDescription.node.play().catch(function (e) {
                return console.error(e);
            });
        });
        t.node.addEventListener('seeked', function () {
            return t.audioDescription.node.currentTime = t.node.currentTime;
        });
        t.node.addEventListener('pause', function () {
            return t.audioDescription.node.pause();
        });
        t.node.addEventListener('ended', function () {
            return t.audioDescription.node.pause();
        });
        t.audioDescription.node.addEventListener('play', function () {
            return t.audioDescription.node.currentTime = t.node.currentTime;
        });
        if (t.options.isVoiceover) t.node.addEventListener('volumechange', function () {
            return t.audioDescription.node.volume = t.node.volume;
        });
    },
    _toggleAudioDescription: function _toggleAudioDescription() {
        var t = this;

        if (!t.audioDescription) t._createAudioDescriptionPlayer();

        if (t.options.audioDescriptionToggled) {
            t.audioDescription.node.volume = t.node.volume;
            if (t.options.isPlaying) t.audioDescription.node.play().catch(function (e) {
                return console.error(e);
            });

            if (!t.options.isVoiceover && t.videoVolumeButton) {
                t.node.muted = true;
                t.audioDescription.node.muted = false;
                mejs.Utils.addClass(t.videoVolumeButton, 'hidden');
                mejs.Utils.removeClass(t.descriptiveVolumeButton, 'hidden');
            }
        } else {
            t.node.volume = t.audioDescription.node.volume;
            t.audioDescription.node.pause();

            if (!t.options.isVoiceover && t.videoVolumeButton) {
                t.audioDescription.node.muted = true;
                t.node.muted = false;
                mejs.Utils.removeClass(t.videoVolumeButton, 'hidden');
                mejs.Utils.addClass(t.descriptiveVolumeButton, 'hidden');
            }
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
