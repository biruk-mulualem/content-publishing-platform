// server.js
require('dotenv').config();  // Load environment variables
const app = require('./app');  // Import app.js file

const PORT = process.env.PORT || 5000;  // Set default port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});