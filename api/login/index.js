const crypto = require("crypto");
const { getContainers } = require("../shared/cosmos");

module.exports = async function (context, req) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    context.res = { status: 400, body: { error: "Username and password required." } };
    return;
  }

  const uid = username.trim().toLowerCase();
  const { usersContainer } = getContainers();

  try {
    const { resource } = await usersContainer.item(uid, uid).read();
    if (!resource) {
      context.res = { status: 401, body: { error: "User not found." } };
      return;
    }
    const hash = crypto.createHash("sha256").update(resource.salt + password).digest("hex");
    if (hash !== resource.hash) {
      context.res = { status: 401, body: { error: "Incorrect password." } };
      return;
    }
    // Generate a simple session token
    const token = crypto.randomBytes(32).toString("hex");
    // Store token in user record (simple approach)
    resource.token = token;
    resource.tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    await usersContainer.item(uid, uid).replace(resource);

    context.res = { status: 200, body: { username: uid, token } };
  } catch (e) {
    if (e.code === 404) {
      context.res = { status: 401, body: { error: "User not found." } };
    } else {
      context.res = { status: 500, body: { error: "Database error." } };
    }
  }
};
