const { getContainers } = require("./cosmos");

async function authenticate(req) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const parts = auth.split(" ");
  if (parts.length !== 3) return null; // "Bearer username token"
  const [, username, token] = parts;

  const { usersContainer } = getContainers();
  try {
    const { resource } = await usersContainer.item(username, username).read();
    if (!resource || resource.token !== token || Date.now() > resource.tokenExpiry) return null;
    return username;
  } catch {
    return null;
  }
}

module.exports = { authenticate };
