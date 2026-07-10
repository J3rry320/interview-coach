import path from "path";
import webpack from "webpack";

export default {
  mode: "production",

  target: "node",

  entry: "./bin/cli.js",

  output: {
    path: path.resolve("dist"),
    filename: "interview-coach.js",
    library: {
      type: "module",
    },
  },

  experiments: {
    outputModule: true,
  },

  externals: [
    async ({ request }) => {
      if (/^[a-z@].*$/.test(request) && !request.startsWith(".") && !path.isAbsolute(request)) {
        return `import ${request}`;
      }
      return undefined;
    }
  ],
  externalsType: "module",

  optimization: {
    splitChunks: false,
  },

  plugins: [
    new webpack.BannerPlugin({
      banner: "#!/usr/bin/env node",
      raw: true,
    }),
  ],
};
