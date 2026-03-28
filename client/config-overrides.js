const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });


function isSourceMapLoaderEntry(u) {
  return (
      (typeof u === "string" && u.includes("source-map-loader")) ||
      (u &&
          typeof u === "object" &&
          typeof u.loader === "string" &&
          u.loader.includes("source-map-loader"))
  );
}

function disableSourceMapLoader(rules) {
  if (!Array.isArray(rules)) return rules;

  const next = [];
  for (const rule of rules) {
    if (!rule) continue;

    if (rule.oneOf) rule.oneOf = disableSourceMapLoader(rule.oneOf);
    if (rule.rules) rule.rules = disableSourceMapLoader(rule.rules);

    if (
        typeof rule.loader === "string" &&
        rule.loader.includes("source-map-loader")
    )
      continue;

    if (Array.isArray(rule.use)) {
      const filteredUse = rule.use.filter((u) => !isSourceMapLoaderEntry(u));
      if (filteredUse.length === 0) continue;
      rule.use = filteredUse;
    }

    next.push(rule);
  }

  return next;
}


module.exports = function override(config) {

  if (config && config.module && config.module.rules) {
    config.module.rules = disableSourceMapLoader(config.module.rules);
  }

  const envKeys = Object.keys(process.env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(process.env[next]);
    return prev;
  }, {});

  config.plugins.push(new webpack.DefinePlugin(envKeys));

  return config;
};