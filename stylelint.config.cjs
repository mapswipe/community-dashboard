const path = require('path');

const cssPaths = [
    path.resolve('./app/Base/styles.module.css'),
];

/** @type {import('stylelint').Config} */
const config = {
    extends: [
        'stylelint-config-recommended',
        'stylelint-config-concentric',
    ],
    plugins: [
        'stylelint-value-no-unknown-custom-properties',
    ],
    rules: {
        'csstools/value-no-unknown-custom-properties': [
            true,
            {
                importFrom: cssPaths,
            },
        ],
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global'],
            },
        ],
    },
};

module.exports = config;
