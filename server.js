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
    const MAX_CHARS = 12000;

    if (pdf.text.length > MAX_CHARS) {
      text = pdf.text.substring(0, MAX_CHARS);
    } else {
      text = pdf.text;
    }	

const prompt = `
Atue como especialista em licitações públicas com domínio da Lei 14.133/2021.

Você deve ANALISAR MINUCIOSAMENTE o edital abaixo, procurando explicitamente cada informação solicitada.

⚠️ REGRAS CRÍTICAS:
- Leia todo o texto disponível
- NÃO ignore informações implícitas
- Se necessário, deduza com base no contexto
- NÃO deixar campos em branco
- Se não encontrar, escrever: "NÃO INFORMADO"
- Cite trechos do edital quando possível

---

## 1. DADOS GERAIS DA CONTRATAÇÃO

Preencha a tabela com base no edital:

| Item | Informação encontrada no edital |
|------|-------------------------------|
| Número da contratação | |
| Valor estimado | |
| Data de início | |
| Data final | |
| Entidade responsável | |
| Portal da licitação | |

---

## 2. ANÁLISE JURÍDICA (Lei 14.133/21)

### 2.1 Exigências restritivas
Identifique cláusulas que possam restringir competitividade:
- Cite trecho do edital

### 2.2 Falhas no objeto
Verifique se o objeto está mal definido ou genérico:
- Explique

### 2.3 Prazos ilegais ou inexequíveis
- Identifique prazos incompatíveis

### 2.4 Exigências documentais irregulares
- Documentos excessivos ou indevidos

### 2.5 Inconsistências entre documentos
- Divergências internas

---

## 3. EXECUÇÃO CONTRATUAL

Monte cronograma com base no edital:

| Etapa | Descrição | Prazo |
|------|----------|------|
| | | |

---

## 4. CONDIÇÕES DE PAGAMENTO

Extraia exatamente:
- Forma:
- Prazo:
- Requisitos:

---

## 5. ENTREGA

- Local:
- Data:
- Hora:

---

## 6. VISÃO ESTRATÉGICA

### Riscos:
- 

### Oportunidades:
- 

### Sugestões:
- 

---

## 7. CLASSIFICAÇÃO FINAL

Classifique com base na Lei 14.133/21:
- Regular
- Regular com Ressalvas
- Irregular

Justifique tecnicamente.

---

## TEXTO DO EDITAL:
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
