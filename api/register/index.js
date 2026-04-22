const crypto = require("crypto");
const { getContainers } = require("../shared/cosmos");

module.exports = async function (context, req) {
  const { username, password } = req.body || {};
  if (!username || !password || username.length < 3 || password.length < 4) {
    context.res = { status: 400, body: { error: "Username (3+ chars) and password (4+ chars) required." } };
    return;
  }

  const uid = username.trim().toLowerCase();
  const { usersContainer } = getContainers();

  // Check if user exists
  try {
    const { resource } = await usersContainer.item(uid, uid).read();
    if (resource) {
      context.res = { status: 409, body: { error: "Username already taken." } };
      return;
    }
  } catch (e) {
    if (e.code !== 404) {
      context.res = { status: 500, body: { error: "Database error." } };
      return;
    }
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(salt + password).digest("hex");

  await usersContainer.items.create({ id: uid, partitionKey: uid, salt, hash });
  context.res = { status: 201, body: { username: uid } };
};
