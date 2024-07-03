const express = require("express");

const app = express();
app.disable("x-powered-by");

const port = process.env.PORT ?? 1234;

app.get("*", (req, res) => {
  res.json({ message: "Hola mundo" });
});

app.listen(port, () => console.log(`listening on http://localhost:${port}`));
