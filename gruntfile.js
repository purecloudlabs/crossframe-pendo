'use strict';

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    webpack: {
      build: {
        entry: './src/crossframe-pendo.js',
        output: {
          path: './dist/',
          filename: 'crossframe-pendo.js',
          library: 'crossframePendo',
          libraryTarget: 'umd'
        },
        module: {
          loaders: [{
            loader: 'babel-loader',
            query: {
              plugins: [
                'transform-es2015-block-scoping',
                'transform-es2015-for-of',
                'transform-es2015-parameters'
              ]
            }
          }]
        }
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: './dist/crossframe-pendo.map'
      },
      build: {
        files: {
          './dist/crossframe-pendo.min.js': './dist/crossframe-pendo.js'
        }
      }
    },
    watch: {
      js: {
        files: [
          './src/**/*.js'
        ],
        tasks: [
          'webpack',
          'uglify'
        ]
      }
    }
  });

  grunt.registerTask('default', ['webpack', 'uglify', 'watch']);

};
