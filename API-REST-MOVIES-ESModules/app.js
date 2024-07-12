import express, { json } from "express";
import { moviesRouter } from "./routes/movies.js";
import { corsMiddleware } from "./middlewares/cors.js";

const app = express();
app.use(json());
app.use(corsMiddleware());
app.disable("x-powered-by");

const port = process.env.PORT ?? 1234;

app.use("/movie", moviesRouter);

app.listen(port, () => console.log(`listening on http://localhost:${port}`));
