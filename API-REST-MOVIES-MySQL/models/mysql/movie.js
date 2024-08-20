import { response } from "express";
import mysql2 from "mysql2/promise";

const config = {
  host: "localhost",
  user: "root",
  port: 3306,
  password: "",
  database: "moviesdb",
};

const connection = await mysql2.createConnection(config);

export class MovieModel {
  static async getAll({ genre }) {
    if (genre) {
      const lowerCaseGenre = genre.toLowerCase();

      const [genres] = await connection.query(
        `SELECT m.title, m.year, m.director, m.duration, m.poster, m.rate 
        FROM movie m 
        JOIN movie_genres mg ON m.id = mg.movie_id 
        JOIN genre g ON mg.genre_id = g.id WHERE g.name = ?`,
        [lowerCaseGenre]
      );

      if (genres.lenght == 0) return [];
      return genres;
    }

    const [movies] = await connection.query(
      "SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) FROM movie;"
    );

    return movies;
  }

  static async getById({ id }) {
    const [movie] = await connection.query(
      `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) 
        FROM movie WHERE id = UUID_TO_BIN(?);`,
      [id]
    );
    if (movie.lenght == 0) return null;
    return movie[0];
  }

  static async create({ input }) {
    const {
      genre, // genre is an array
      title,
      year,
      duration,
      director,
      rate,
      poster,
    } = input;

    const [uuidResult] = await connection.query("SELECT UUID() uuid;");
    const [{ uuid }] = uuidResult;
    console.log(uuid);
    try {
      // Verificar si todos los géneros existen en la base de datos
      const genreIds = [];
      for (const genreName of genre) {
        const [genreResult] = await connection.query(
          `SELECT id FROM genre WHERE name = ?;`,
          [genreName]
        );
        if (genreResult.length === 0) {
          throw new Error(`Genre '${genreName}' does not exist`);
        }
        genreIds.push(genreResult[0].id);
      }

      // Insertar la película
      await connection.query(
        `INSERT INTO movie (id, title, year, duration, director, rate, poster) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?);`,
        [uuid, title, year, duration, director, rate, poster]
      );

      // Insertar relaciones en movie_genres
      for (const genreId of genreIds) {
        await connection.query(
          `INSERT INTO movie_genres (movie_id, genre_id) VALUES (UUID_TO_BIN(?), ?);`,
          [uuid, genreId]
        );
      }
    } catch (error) {
      console.error(error);
      throw new Error("Error creating movie");
    }

    const [movie] = await connection.query(
      `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movie WHERE id = UUID_TO_BIN(?);`,
      [uuid]
    );

    const [genres] = await connection.query(
      `SELECT g.name FROM genre g
        JOIN movie_genres mg ON g.id = mg.genre_id
        WHERE mg.movie_id = UUID_TO_BIN(?);`,
      [uuid]
    );

    movie[0].genre = genres.map((genre) => genre.name);

    return movie[0];
  }

  static async delete({ id }) {
    try {
      const [response] = await connection.query(
        "DELETE FROM movie WHERE id = UUID_TO_BIN(?);",
        [id]
      );

      if (response.affectedRows == 0) return false;

      // Borrar relaciones en movie_genres
      const [responseGenres] = await connection.query(
        "DELETE FROM movie_genres WHERE movie_id = UUID_TO_BIN(?);",
        [id]
      );
      if (responseGenres.affectedRows == 0) return false;
    } catch (error) {
      console.error(error);
      throw new Error("Error deleting movie");
    }
    return true;
  }

  static async update({ id, input }) {
    const {
      genre, // genre is an array
      title,
      year,
      duration,
      director,
      rate,
      poster,
    } = input;

    try {
      const [response] = await connection.query(
        `UPDATE movie SET title = ?, year = ?, duration = ?, director = ?, rate = ?, poster = ? WHERE id = UUID_TO_BIN(?);`,
        [title, year, duration, director, rate, poster, id]
      );

      if (response.affectedRows == 0) return false;

      // Obtener los géneros actuales de la película
      const [currentGenres] = await connection.query(
        `SELECT c.id, c.name FROM genre c
        JOIN movie_genres mc ON c.id = mc.genre_id
        WHERE mc.movie_id = UUID_TO_BIN(?);`,
        [id]
      );

      const currentGenreNames = currentGenres.map((g) => g.name);

      // Determinar los géneros a agregar y los géneros a eliminar
      const genresToAdd = genre.filter((g) => !currentGenreNames.includes(g));
      const genresToRemove = currentGenreNames.filter(
        (g) => !genre.includes(g)
      );

      // Agregar nuevos géneros
      for (const genreFor of genresToAdd) {
        const [genreResult] = await connection.query(
          `SELECT id FROM genre WHERE name = ?;`,
          [genreFor]
        );
        let genreId;
        if (genreResult.length > 0) {
          genreId = genreResult[0].id;
        } else throw new Error(`Genre '${genreFor}' does not exist`);

        await connection.query(
          `INSERT INTO movie_genres (movie_id, genre_id) VALUES (UUID_TO_BIN(?), ?);`,
          [id, genreId]
        );
      }

      // Eliminar géneros que ya no están asociados
      for (const genreRem of genresToRemove) {
        const [genreResult] = await connection.query(
          `SELECT id FROM genre WHERE name = ?;`,
          [genreRem]
        );
        if (genreResult.length > 0) {
          const genreId = genreResult[0].id;
          await connection.query(
            `DELETE FROM movie_genres WHERE movie_id = UUID_TO_BIN(?) AND genre_id = ?;`,
            [id, genreId]
          );
        }
      }
    } catch (error) {
      console.error(error);
      throw new Error("Error updating movie");
    }

    const [movies] = await connection.query(
      `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movie WHERE id = UUID_TO_BIN(?);`,
      [id]
    );

    return movies[0];
  }
}
