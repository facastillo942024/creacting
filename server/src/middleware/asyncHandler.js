// Envuelve controladores async para capturar errores y pasarlos a next().
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
