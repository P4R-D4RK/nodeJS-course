import { MovieModel } from "./models/mysql/movie.js";
import { createApp } from "./app.js";

createApp({ movieModel: MovieModel });
