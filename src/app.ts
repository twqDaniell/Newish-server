import initApp from "./server";
import appInit from "./server";
const port = process.env.PORT || 4002;
import https from "https";
import http from "http";
import fs from "fs";

const tmpFunc = async () => {
  console.log("Starting server...");
  console.log("PORT", port);
  
  

  initApp().then((app) => {
    if (process.env.NODE_ENV !== "production") {
      http.createServer(app).listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
      });
    } else {
      const httpsOptions = {
        key: fs.readFileSync("./client-key.pem"),
        cert: fs.readFileSync("./client-cert.pem"),
      };

      https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`Server is running on https://localhost:${port}`);
      });
    }
  });
};

tmpFunc();
