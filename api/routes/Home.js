const express = require("express");
const middleware = require("../helper/middleware");
const router = express.Router(),
  Controller = require("../controllers/HomeController");

// router.get('/', (req, res) => {
//     res.send("Welcome to API Pertare");
// });
router.get("/", (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to API Pertare</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f7fa;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
              }
              .container {
                  background-color: #fff;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  padding: 20px;
                  width: 80%;
                  max-width: 600px;
                  text-align: center;
              }
              h1 {
                  color: #4caf50;
                  font-size: 2rem;
              }
              p {
                  font-size: 1.2rem;
              }
              .button {
                  background-color: #4caf50;
                  color: white;
                  padding: 10px 20px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  text-decoration: none;
              }
              .button:hover {
                  background-color: #45a049;
              }
              footer {
                  margin-top: 20px;
                  font-size: 0.9rem;
                  color: #777;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Welcome to the API Pertare</h1>
              <p>This is the main API endpoint for Pertare.</p>
              <p>Version: 1.0.0</p>
              <p>To access the available endpoints, refer to the documentation below:</p>
              <a href="https://documenter.getpostman.com/view/18941111/2sAYdkGocB" target="_blank" class="button">View Documentation</a>
              <footer>
                  <p>Contact support: <a href="mailto:support@pertare.com">support@pertare.com</a></p>
              </footer>
          </div>
      </body>
      </html>
  `);
});

router.get("/health", Controller.health);
router.get("/home", middleware.authAdmin, Controller.get);
router.get("/home/content", Controller.content);
router.get("/home/diagram", middleware.authAdmin, Controller.getDiagram);
router.post("/home/diagram", middleware.authAdmin, Controller.updateDiagram);
router.post("/home", middleware.authAdmin, Controller.add);

module.exports = router;
