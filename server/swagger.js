const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: " API",
    version: "1.0.0",
    description: "Documentation for API with Swagger UI",
  },
  servers: [
    {
      url: "http://localhost:9999/api",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // đường dẫn đến các file định nghĩa route có swagger comment
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
