const jsonServer = require("json-server");
const rateLimit = require("express-rate-limit");
const server = jsonServer.create();
const middlewares = jsonServer.defaults();
const router = jsonServer.router("db.json");

server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP nesse período
});
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // criar posts
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // tentativas de login
});
const diarioLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Requisicao progressos
});
const communityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // permitir carregar lista sem bloquear
  skipSuccessfulRequests: true,
});

function auth(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}
server.put("/usuarios/:id", auth, (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (String(req.params.id) !== String(userId)) {
    return res.status(403).json({ error: "Sem permissão" });
  }
  next();
});

function onlyOwner(resource) {
  return (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const id = req.params.id;

    const data = router.db
      .get(resource)
      .find({ id: Number(id) })
      .value();
    if (!data) {
      return res.status(404).json({ error: "Recurso não encontrado" });
    }

    if (String(data.user_id) !== String(userId)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    next();
  };
}
server.get("/time", (req, res) => {
  const now = new Date();
  res.json({
    iso: now.toISOString(),
  });
});

server.post("/posts", auth, postLimiter);
server.put("/posts/:id", auth, onlyOwner("posts"), postLimiter);

server.post("/usuarios", loginLimiter);
server.put("/usuarios/:id", auth, loginLimiter);

server.post("/communities", auth, communityLimiter);
server.put("/communities/:id", auth, communityLimiter);

server.post("/progressos", auth, diarioLimiter);
server.put("/progressos/:id", auth, onlyOwner("progressos"), diarioLimiter);

server.use(middlewares);
server.use(router);

server.listen(process.env.PORT || 3000, () => {
  console.log("API online");
});
