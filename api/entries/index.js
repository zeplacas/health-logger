const { getContainers } = require("../shared/cosmos");
const { authenticate } = require("../shared/auth");

module.exports = async function (context, req) {
  const username = await authenticate(req);
  if (!username) {
    context.res = { status: 401, body: { error: "Not authenticated." } };
    return;
  }

  const { container } = getContainers();
  const method = req.method.toUpperCase();

  // GET - list all entries for user
  if (method === "GET") {
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.username = @user ORDER BY c.date DESC, c.time DESC",
        parameters: [{ name: "@user", value: username }]
      })
      .fetchAll();
    context.res = { body: resources };
    return;
  }

  // POST - add entry
  if (method === "POST") {
    const { date, time, systolic, diastolic, heartRate, weight } = req.body || {};
    if (!date || !time || !systolic || !diastolic || !heartRate || !weight) {
      context.res = { status: 400, body: { error: "All fields required." } };
      return;
    }
    const entry = {
      id: Date.now().toString(),
      username,
      partitionKey: username,
      date, time,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      heartRate: Number(heartRate),
      weight: Number(weight)
    };
    const { resource } = await container.items.create(entry);
    context.res = { status: 201, body: resource };
    return;
  }

  // DELETE - remove entry
  if (method === "DELETE") {
    const id = context.bindingData.id;
    if (!id) {
      context.res = { status: 400, body: { error: "Entry ID required." } };
      return;
    }
    // Verify ownership
    try {
      const { resource } = await container.item(id, username).read();
      if (!resource || resource.username !== username) {
        context.res = { status: 404, body: { error: "Entry not found." } };
        return;
      }
      await container.item(id, username).delete();
      context.res = { status: 200, body: { deleted: id } };
    } catch (e) {
      context.res = { status: 404, body: { error: "Entry not found." } };
    }
    return;
  }

  context.res = { status: 405, body: { error: "Method not allowed." } };
};
