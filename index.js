var ConcatSource = require('webpack/lib/ConcatSource');
var OriginalSource = require('webpack/lib/OriginalSource');

module.exports = function ExtractBootstrapWebpackPlugin() {};

ExtractBootstrapWebpackPlugin.prototype.apply = function(compiler) {
  // Affect only the top level compilation. Child compilers like extract text
  // and html plugin evaluate the bundles without storing to disk so they won't
  // be able to require the bootstrap that isn't on disk.
  compiler.plugin('this-compilation', function(compilation) {
    compilation.mainTemplate.plugin('render', function(fullSource) {

      // Find the bootstrap source.
      var bootstrapSource = fullSource.children[1]._source;

      // Source we'll write to a library
      var bootstrapOutput = new ConcatSource();
      bootstrapOutput.add('module.exports = function(modules) {\n');
      bootstrapOutput.add(bootstrapSource);
      bootstrapOutput.add('};\n');

      // Hash the bootstrap in case there are different ones in different
      // bundles.
      var bootstrapHash = require('crypto').createHash('md5');
      bootstrapSource.updateHash(bootstrapHash);
      var bootstrapDigest = bootstrapHash.digest('hex');
      var bootstrapFilename = 'bootstrap-' + bootstrapDigest + '.js';
      compilation.assets[bootstrapFilename] = bootstrapOutput;

      // Replace the original bootstrap.
      var bootstrapPath = path.resolve(process.cwd(), compiler.options.output.path, bootstrapFilename);
      fullSource.children[1]._source = new OriginalSource([
        'return require("' + bootstrapPath + '")(modules);',
        '',
      ].join('\n'), 'webpack/bootstrap-' + bootstrapDigest);

      // Return the modified source of the bundle.
      return fullSource;
    });
  });
};
