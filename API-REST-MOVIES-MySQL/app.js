import express, { json } from "express";
import { createMoviesRouter } from "./routes/movies.js";
import { corsMiddleware } from "./middlewares/cors.js";
import "dotenv/config";

export const createApp = ({ movieModel }) => {
  const app = express();
  app.use(json());
  app.use(corsMiddleware());
  app.disable("x-powered-by");

  app.use("/movie", createMoviesRouter({ movieModel }));
  const PORT = process.env.PORT || 1234;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  return app;
};
