const path = require('path');

module.exports = {
    entry: {
        management: './src/management.js',
        background: './src/background.js',
    },
    mode: 'production',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    }
};