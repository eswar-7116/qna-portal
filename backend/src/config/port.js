// Normalize a port into a number, string, or false.
exports.normalizePort = (val) => {
  const PORT = parseInt(val, 10);

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(PORT)) {
    // named pipe
    return val;
  }

  if (PORT >= 0) {
    // port number
    return PORT;
  }

  return false;
};

// Event listener for HTTP server "error" event.
exports.onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`Binding to that port requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Binding to that port is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};
