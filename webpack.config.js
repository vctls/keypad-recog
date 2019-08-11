const path = require('path');
const Copy = require('copy-webpack-plugin');

module.exports = {
    plugins: [
        new Copy([
            { from: 'node_modules/tesseract.js/dist/worker.min.js', to: 'worker.min.js' },
            { from: 'node_modules/tesseract.js-core/tesseract-core.wasm.js', to: 'tesseract-core.wasm.js' },
        ]),
    ],
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    }
};