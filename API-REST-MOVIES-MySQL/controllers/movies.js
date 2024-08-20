// import { MovieModel } from "../models/local-file-system/movie.js";
import { MovieModel } from "../models/mysql/movie.js";
import { validateMovie, validatePartialMovie } from "../schemas/movie.js";

export class MovieController {
  static async getAll(req, res) {
    const { genre } = req.query;
    console.log("GENEROS", genre);
    const movies = await MovieModel.getAll({ genre });
    res.json(movies);
  }

  static async getById(req, res) {
    const { id } = req.params;
    const movie = await MovieModel.getById({ id });
    if (movie) return res.json(movie);
    res.status(404).json({ message: "Movie not found" });
  }

  static async create(req, res) {
    console.log(req);
    const result = validateMovie(req.body);

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const newMovie = await MovieModel.create({ input: result.data });

    res.status(201).json(newMovie);
  }

  static async delete(req, res) {
    const { id } = req.params;

    const result = await MovieModel.delete({ id });
    if (result == false) {
      return res.status(404).json({ message: "Movie not found" });
    }
    return res.json({ message: "Movie deleted" });
  }

  static async patch(req, res) {
    const result = validatePartialMovie(req.body);

    if (!result.success) {
      return res.status(404).json({ error: JSON.parse(result.error.message) });
    }
    const { id } = req.params;

    const updateMovie = await MovieModel.update({ id, input: result.data });

    return res.json(updateMovie);
  }
}
