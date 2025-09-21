// @ts-nocheck
// The io object is globally available from the script tag in index.html.
// Replace the URL with your actual server address if it's not running on localhost.
// Make sure the server is running on port 3001 or change the port here.
const SERVER_URL = "https://beauty-contest-game.onrender.com";
export const socket = io(SERVER_URL);
