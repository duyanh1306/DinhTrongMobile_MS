const swaggerJSDoc = require("swagger-jsdoc");
require("dotenv").config();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: " API",
    version: "1.0.0",
    description: "Documentation for API with Swagger UI",
  },
  servers: [
    {
      url: process.env.IP_ADDRESS,
      description: "Local"
    },
    {
      url: process.env.IP_ADDRESS + `:9999`,
      description: "Production server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT authentication token"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // đường dẫn đến các file định nghĩa route có swagger comment
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
