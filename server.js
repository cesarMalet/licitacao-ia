import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import fs from "fs";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("API de análise de licitações rodando 🚀");
});

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.post("/analisar", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Arquivo não enviado" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const pdf = await pdfParse(buffer);

    let text = "";

// 🔥 LIMITADOR INTELIGENTE
    const MAX_CHARS = 8000;

    if (pdf.text.length > MAX_CHARS) {
      text = pdf.text.substring(0, MAX_CHARS);
    } else {
      text = pdf.text;
    }	

    const prompt = `
Atue como um especialista em licitações públicas e auditoria, com domínio da Lei 14.133/2021.

Analise o edital fornecido, considerando que se trata de uma contratação por DISPENSA DE LICITAÇÃO.

Elabore um RELATÓRIO TÉCNICO COMPLETO, com linguagem profissional e foco consultivo, contendo:

1. Tabela com:
- Número da contratação
- Valor estimado
- Data de início
- Data final
- Entidade responsável
- Portal da licitação

2. Análise jurídica com base na Lei 14.133/21, identificando:
- Exigências restritivas (citar trechos do edital)
- Falhas ou ausência de clareza no objeto
- Prazos ilegais ou inexequíveis
- Exigências documentais irregulares ou excessivas
- Inconsistências entre documentos
- Declarações e atestados técnicos exigidos

3. Execução contratual:
- Tabela com cronograma de entrega dos produtos/serviços

4. Condições de pagamento:
- Forma, prazo e requisitos

5. Informações de entrega:
- Local, data e hora

6. Visão estratégica:
- Riscos para participação
- Oportunidades comerciais
- Sugestões de melhoria do edital

7. Classificação final:
- Regular, Regular com Ressalvas ou Irregular (com justificativa técnica)

IMPORTANTE:
- Se alguma informação não estiver presente, escrever: "NÃO INFORMADO"
- Organizar a resposta com títulos claros, separações e tabelas bem definidas
- Não responder de forma genérica
- Estruturar como um parecer profissional

Edital para análise:
${text}
`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
       {
          role: "user",
          content: prompt,
       },
     ],
   });

  console.log("RESPOSTA IA:", completion);

    fs.unlinkSync(req.file.path);

    res.json({
      resultado: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
