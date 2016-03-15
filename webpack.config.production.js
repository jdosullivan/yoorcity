const path = require('path');
const merge = require('webpack-merge');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const TARGET = process.env.npm_lifecycle_event;
process.env.BABEL_ENV = TARGET;

const PATHS = {
    app: path.join(__dirname, 'app/'),
    build: path.join(__dirname, 'build'),
    style: path.join(__dirname, 'app/main.css')
};

// Load *package.json* so we can use `dependencies` from there
const pkg = require('./package.json');

const common = {

    // Entry accepts a path or an object of entries. We'll be using the
    // latter form given it's convenient with more complex configurations.
    entry: {
        app: PATHS.app,
        style: PATHS.style
    },
    // Add resolve.extensions.
    // '' is needed to allow imports without an extension.
    // Note the .'s before extensions as it will fail to match without!!!
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: PATHS.build,
        // Output using entry name
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                // Set up jsx. This accepts js too thanks to RegExp
                test: /\.jsx?$/,
                // Enable caching for improved performance during development
                // It uses default OS directory by default. If you need something
                // more custom, pass a path to it. I.e., babel?cacheDirectory=<path>
                loaders: ['babel?cacheDirectory'],
                // Parse only app files! Without this it will go through entire project.
                // In addition to being slow, that will most likely result in an error.
                include: PATHS.app
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'node_modules/html-webpack-template/index.ejs',
            title: 'Kanban app',
            appMountId: 'app',
            inject: false
        })
    ]
};

module.exports = merge(common, {
    // Define vendor entry point needed for splitting
    entry: {
        vendor: Object.keys(pkg.dependencies).filter(function (v) {
            // Exclude alt-utils as it won't work with this setup
            // due to the way the package has been designed
            // (no package.json main).
            return v !== 'alt-utils';
        })
    },
    output: {
        path: PATHS.build,
        filename: '[name].[chunkhash].js',
        chunkFilename: '[chunkhash].js'
    },
    module: {
        loaders: [
            // Extract CSS during build
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style', 'css'),
                include: PATHS.app
            }
        ]
    },
    plugins: [
        new CleanPlugin([PATHS.build]),

        // Extract vendor and manifest files
        new webpack.optimize.CommonsChunkPlugin({
            names: ['vendor', 'manifest']
        }),
        // Setting DefinePlugin affects React library size!
        // DefinePlugin replaces content "as is" so we need some extra quotes
        // for the generated code to make sense
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'

            // You can set this to JSON.stringify('development') for your
            // development target to force NODE_ENV to development mode
            // no matter what
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.optimize.DedupePlugin(),
        // Output extracted CSS to a file
        new ExtractTextPlugin('[name].[chunkhash].css')
    ],
    target: 'node', // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()] // in order to ignore all modules in node_modules folder
});