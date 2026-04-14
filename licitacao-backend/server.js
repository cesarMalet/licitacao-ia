import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import fs from "fs";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analisar", upload.single("file"), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    const pdf = await pdfParse(buffer);

    const prompt = `
Atue como um especialista em licitações públicas e auditoria, com domínio da Lei 14.133/2021.

Analise o edital abaixo:

${pdf.text}

(Use TODA a estrutura solicitada: tabelas, análise jurídica, riscos, oportunidades e classificação final)
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    fs.unlinkSync(req.file.path);

    res.json({
      resultado: response.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao analisar edital" });
  }
});

app.listen(3000, () => console.log("Servidor rodando"));
