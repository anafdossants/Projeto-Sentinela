const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());

// 🔐 CORS mais seguro (ajuste depois se quiser)
app.use(cors({ origin: "*" }));

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");

// ===================== DB =====================
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        return { usuarios: [], pacientes: [], triagens: [], consultas: [] };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===================== REGRAS DE RISCO =====================
function calcularRisco(sintoma, temperatura) {
    const vermelhos = [
        "infarto",
        "avc",
        "convulsao",
        "hemorragia",
        "falta_ar_grave"
    ];

    const amarelos = [
        "febre",
        "vomito",
        "diarreia",
        "falta_ar_moderada"
    ];

    if (temperatura >= 39) return "vermelho";
    if (vermelhos.includes(sintoma)) return "vermelho";
    if (amarelos.includes(sintoma)) return "amarelo";

    return "verde";
}

// ===================== LOGIN =====================
app.post("/login", (req, res) => {
    const db = readDB();

    const user = db.usuarios.find(
        u => u.usuario === req.body.usuario && u.senha === req.body.senha
    );

    if (!user) {
        return res.status(401).json({ erro: "Login inválido" });
    }

    // 🚨 não enviar senha de volta
    const { senha, ...safeUser } = user;

    res.json(safeUser);
});

// ===================== TRIAGEM =====================
app.post("/triagem", (req, res) => {
    const db = readDB();

    const { nome, sintoma, temperatura, alergia, observacao } = req.body;

    if (!nome || !sintoma) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    const risco = calcularRisco(sintoma, Number(temperatura || 0));

    const triagem = {
        id: Date.now(),
        nome,
        sintoma,
        temperatura: Number(temperatura || 0),
        alergia: alergia || "Nenhuma",
        observacao: observacao || "",
        risco,
        status: "aguardando_medico",
        createdAt: new Date()
    };

    db.triagens.push(triagem);
    writeDB(db);

    res.json(triagem);
});

// ===================== LISTAR TRIAGENS =====================
app.get("/triagens", (req, res) => {
    const db = readDB();
    res.json(db.triagens);
});

// ===================== CONSULTA =====================
app.post("/consulta", (req, res) => {
    const db = readDB();

    const { paciente, diagnostico, medicacao, observacao } = req.body;

    if (!paciente) {
        return res.status(400).json({ erro: "Paciente obrigatório" });
    }

    const consulta = {
        id: Date.now(),
        paciente,
        diagnostico: diagnostico || "",
        medicacao: medicacao || "",
        observacao: observacao || "",
        createdAt: new Date()
    };

    db.consultas.push(consulta);
    writeDB(db);

    res.json(consulta);
});

// ===================== START =====================
app.listen(3000, () => {
    console.log("🏥 Sentinela rodando em http://localhost:3000");
});
