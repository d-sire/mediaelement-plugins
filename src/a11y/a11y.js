'use strict';

mejs.i18n.en['mejs.a11y-video-description'] = 'Toggle sign language';
mejs.i18n.en['mejs.a11y-audio-description'] = 'Toggle audio description';

Object.assign(mejs.MepDefaults, {
    /**
     * Video description is toggled
     * @type {boolean}
     */
    videoDescriptionToggled: false,
    /**
     * Audio description is toggled
     * @type {boolean}
     */
    audioDescriptionToggled: false,
    /**
     * Store for initial source file
     * @type {?string}
     */
    defaultSource: null,
    /**
     * Store for best matching audio description file
     * @type {?string}
     */
    audioDescriptionSource: null,
    /**
     * Store for best matching video description file
     * @type {?string}
     */
    videoDescriptionSource: null,
    /**
     * if the player is currently playing
     * @type {boolean}
     */
    isPlaying: false,
    /**
     * should audio description be voiceover
     * @type {boolean}
     */
    isVoiceover: false,
});


Object.assign(MediaElementPlayer.prototype, {
    builda11y ()  {
        const t = this;

        t.options.defaultSource = this.node.src;
        t.options.audioDescriptionSource = t._loadSourceFromAttribute('data-audio-description');
        t.options.videoDescriptionSource = t._loadSourceFromAttribute('data-video-description');

        if (t.options.audioDescriptionSource) t._createAudioDescription();
        if (t.options.videoDescriptionSource) t._createVideoDescription();

        t.node.addEventListener('play', () => t.options.isPlaying = true);
        t.node.addEventListener('playing', () => t.options.isPlaying = true);
        t.node.addEventListener('pause', () => t.options.isPlaying = false);
        t.node.addEventListener('ended', () => t.options.isPlaying = false);
    },

    _createAudioDescription() {
        const t = this;

        const audioDescriptionTitle = mejs.i18n.t('mejs.a11y-audio-description');
        const audioDescriptionButton = document.createElement('div');
        audioDescriptionButton.className = `${t.options.classPrefix}button ${t.options.classPrefix}audio-description-button`;
        audioDescriptionButton.innerHTML = `<button type="button" aria-controls="${t.id}" title="${audioDescriptionTitle}" aria-label="${audioDescriptionTitle}" tabindex="0"></button>`;

        t.addControlElement(audioDescriptionButton, 'audio-description');

        audioDescriptionButton.addEventListener('click', () => {
            t.options.audioDescriptionToggled = !t.options.audioDescriptionToggled;
            mejs.Utils.toggleClass(audioDescriptionButton, 'audio-description-on');

            t._toggleAudioDescription();
        });
    },

    /**
     * Create video description button and bind events
     * @private
     * @returns {undefined}
     */
    _createVideoDescription() {
        const t = this;
        const videoDescriptionTitle = mejs.i18n.t('mejs.a11y-video-description');
        const videoDescriptionButton = document.createElement('div');
        videoDescriptionButton.className = `${t.options.classPrefix}button ${t.options.classPrefix}video-description-button`;
        videoDescriptionButton.innerHTML = `<button type="button" aria-controls="${t.id}" title="${videoDescriptionTitle}" aria-label="${videoDescriptionTitle}" tabindex="0"></button>`;
        t.addControlElement(videoDescriptionButton, 'video-description');

        videoDescriptionButton.addEventListener('click', () => {
            t.options.videoDescriptionToggled = !t.options.videoDescriptionToggled;
            mejs.Utils.toggleClass(videoDescriptionButton, 'video-description-on');

            t._toggleVideoDescription();
        });
    },

    /**
     * Load the best matching source file from a data attribute
     * @private
     * @param {String} attribute - data attribute for a source object.
     * @returns {?String} source - best matching source file or null
     */
    _loadSourceFromAttribute(attribute) {
        const t = this;
        if (!t.node.hasAttribute(attribute)) return null;

        let sources = null;
        let json;

        try {
            const data = t.node.getAttribute(attribute);
            json = JSON.parse(data);
        } catch(error) {
            console.error(`error loading ${attribute}: ${error.message}`);
        } finally {
            sources = json;
        }

        return (sources) ? this._evaluateBestMatchingSource(sources) : null;
    },

    /**
     * Evaluate the best matching source from an array of sources
     * @private
     * @param {Array.<{src: String, type: String}>} sourceArray
     * @returns {?String} source
     */
    _evaluateBestMatchingSource(sourceArray) {
        const canPlayType = type => this.node.canPlayType(type);

        // checking most likely support
        const propablySources = sourceArray.filter(file => canPlayType(file.type) === 'probably');
        if (propablySources.length > 0) return propablySources[0].src;

        // checking might support
        const alternativeSources = sourceArray.filter(file => canPlayType(file.type) === 'maybe');
        if (alternativeSources.length > 0) return alternativeSources[0].src;

        return null;
    },

    _createAudioDescriptionPlayer() {
        console.log('creating audio player');
        const t = this;

        // TODO: move to audio object instead dom node if possible
        // const audio = new Audio(t.options.audioDescriptionSource);
        // audio.preload = 'metadata';
        // audio.playsinline = true;
        // audio.volume = 1;

        const audioNode = document.createElement('audio');
        audioNode.setAttribute('src', t.options.audioDescriptionSource);
        audioNode.setAttribute('preload', 'metadata');
        audioNode.setAttribute('playsinline', '');
        audioNode.setAttribute('controls', '');
        document.body.appendChild(audioNode);
        audioNode.load();
        audioNode.muted = true;

        // trigger initial play/pause inside the trusted event, to match safari requirements
        audioNode.play().then(() => {
            t.audioDescriptionNode.currentTime = t.node.currentTime;
            if(!t.options.isPlaying) audioNode.pause();
        }).catch(e => console.error(e));


        t.audioDescriptionNode = audioNode;

        audioNode.addEventListener('loadeddata', () => console.info('loadeddata'));
        audioNode.addEventListener('loadstart', () => console.info('loadstart'));






        // bind audio events
        t.node.addEventListener('play', () => {
            t.audioDescriptionNode.currentTime = t.node.currentTime;
            const promise = t.audioDescriptionNode.play();
            promise.catch(e => console.error(e));
        });
        t.audioDescriptionNode.addEventListener('play', () => t.audioDescriptionNode.currentTime = t.node.currentTime);
        t.node.addEventListener('seeked', () => t.audioDescriptionNode.currentTime = t.node.currentTime);
        t.node.addEventListener('pause', () => t.audioDescriptionNode.pause());
        t.node.addEventListener('ended', () => t.audioDescriptionNode.pause());
    },

    _toggleAudioDescription() {
        const t = this;

        if (!t.audioDescriptionNode) t._createAudioDescriptionPlayer();

        if (t.options.audioDescriptionToggled) {
            t.audioDescriptionNode.volume = t.node.volume;
            t.node.muted = true;
            t.audioDescriptionNode.muted = false;
            if (t.options.isPlaying) t.audioDescriptionNode.play().catch(e => console.error(e));
        } else {
            t.audioDescriptionNode.muted = true;
            t.node.muted = false;
            t.audioDescriptionNode.pause();
        }
    },

    _toggleVideoDescription() {
        const t = this;
        const currentTime = t.node.currentTime;
        const wasPlaying = t.options.isPlaying;
        const active = t.options.videoDescriptionToggled;

        t.node.pause();

        t.node.setSrc((active) ? t.options.videoDescriptionSource : t.options.defaultSource);

        t.node.load();
        t.node.setCurrentTime(currentTime);

        if (wasPlaying) t.node.play();
    }
});
