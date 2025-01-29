import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Internet applications 2nd task",
      version: "1.0.0",
      description: "API documentation for Internet applications 2nd task",
    },
    servers: [
      {
        url: `http://${process.env.IP}:3002`, // Your API base URL
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
