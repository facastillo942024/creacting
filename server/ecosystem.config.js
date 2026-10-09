// Configuracion de PM2 para CreactingCinema API.
// Uso en el servidor:
//   pm2 start ecosystem.config.js
//   pm2 save            (persiste la lista de procesos)
//   pm2 startup         (genera el script de arranque en boot; seguir sus instrucciones)
//
// Las variables sensibles (DB, JWT) se leen del archivo .env (via dotenv en config.js),
// NO se ponen aqui. Aqui solo va lo operativo del proceso.
module.exports = {
  apps: [
    {
      name: "creacting-api",
      script: "src/server.js",
      cwd: __dirname,               // ejecuta desde la carpeta server/
      instances: 1,                 // subir a "max" solo si el codigo es stateless (JWT lo es)
      exec_mode: "fork",            // "cluster" si algun dia usas instances > 1
      watch: false,                 // en produccion no observamos cambios
      max_memory_restart: "300M",   // reinicia si supera este uso de memoria
      env: {
        NODE_ENV: "production",
      },
      // Logs (PM2 los rota si instalas pm2-logrotate)
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true,                   // antepone timestamp a cada linea de log
    },
  ],
};
