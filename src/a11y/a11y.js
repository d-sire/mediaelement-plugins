'use sctrict';

// Translations (English required)
mejs.i18n.en['mejs.a11y-sign-language'] = '';
mejs.i18n.en['mejs.a11y-audio-description'] = '';

Object.assign(mejs.MepDefaults, {

    /**
     * Accessible sign language video is selected
     * @type {Boolean}
     */
    a11ySignLanguageVideoSelected: false,

    /**
     * Accessible descriptive audio is selected
     * @type {Boolean}
     */
    a11yDescriptiveAudioSelected: false,
});
