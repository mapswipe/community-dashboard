module.exports = {
    plugins: [
        require('autoprefixer'),
        require('postcss-preset-env'),
        require('postcss-nested'),
        require('postcss-normalize'),
        {
            postcssPlugin: 'remove-ie-filters',
            Declaration(decl) {
                if (
                    decl.prop === 'filter' &&
                    decl.value.startsWith('progid:DXImageTransform.Microsoft')
                ) {
                    decl.remove();
                }
            },
        },
    ],
};
