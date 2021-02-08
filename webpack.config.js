const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  output: {
    path: path.resolve(__dirname, 'build')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html')
    }),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "public", to: "." }
      ],
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: '10'
                  }
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()]
  }
}
