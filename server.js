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
Atue como especialista em licitações públicas, com domínio da Lei 14.133/2021.

Sua resposta DEVE seguir exatamente a estrutura abaixo, com formatação profissional em Markdown.

⚠️ REGRAS OBRIGATÓRIAS:
- Não escrever texto fora das seções
- Usar títulos com "##"
- Usar tabelas em Markdown
- Não responder de forma genérica
- Sempre preencher com "NÃO INFORMADO" quando faltar dado
- Linguagem técnica, objetiva e profissional

---

## 1. DADOS GERAIS DA CONTRATAÇÃO

| Item | Informação |
|------|-----------|
| Número da contratação | |
| Valor estimado | |
| Data de início | |
| Data final | |
| Entidade responsável | |
| Portal da licitação | |

---

## 2. ANÁLISE JURÍDICA (Lei 14.133/21)

### 2.1 Exigências restritivas (citar trechos do edital)
- 

### 2.2 Falhas ou ausência de clareza no objeto
- 

### 2.3 Prazos ilegais ou inexequíveis
- 

### 2.4 Exigências documentais irregulares ou excessivas
- 

### 2.5 Inconsistências entre documentos
- 

---

## 3. LISTAR DE DOCUMENTOS

### 3.1 Alvarás
- 

### 3.2 Certificado de regularidade
- 

### 3.3 Prova de regularidade
- 

### 3.4 Certidões negativas
- 

### 3.5 Atestados de Capacidade Técnica
- 

### 3.6 Comprovação de Enquadramento
- 

---
## 4. EXECUÇÃO CONTRATUAL

| Etapa | Descrição | Prazo |
|------|----------|------|
| | | |

---

## 5. CONDIÇÕES DE PAGAMENTO

Descrever de forma clara:
- Forma:
- Prazo:
- Requisitos:

---

## 6. ENTREGA (se a entrega for conforme outro documento, informar como Obs:)

- Local:
- Data:
- Hora:

---

## 7. VISÃO ESTRATÉGICA

### Riscos:
- 

### Oportunidades:
- 

### Sugestões:
- 

---

## 8. CLASSIFICAÇÃO FINAL

Classificação: (Regular / Regular com Ressalvas / Irregular)
-
Justificativa:
-

---

## 9. Se alguma informação não estiver presente no edital, indicar explicitamente como "NÃO INFORMADO" e analisar o impacto jurídico dessa ausência.:

---

## EDITAL ANALISADO:
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
