const { CosmosClient } = require("@azure/cosmos");

let client, container, usersContainer;

function getContainers() {
  if (!client) {
    client = new CosmosClient(process.env.COSMOS_CONNECTION);
    const db = client.database("healthlogger");
    container = db.container("entries");
    usersContainer = db.container("users");
  }
  return { container, usersContainer };
}

module.exports = { getContainers };
