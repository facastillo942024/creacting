// Punto de entrada: levanta el servidor HTTP.
const fs = require('fs');
const path = require('path');
const app = require('./app');
const config = require('./config');

// Asegura que exista la carpeta de uploads.
const uploadPath = path.resolve(__dirname, '..', config.uploads.dir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.listen(config.port, () => {
  console.log(`CreactingCinema API escuchando en http://localhost:${config.port}`);
});
