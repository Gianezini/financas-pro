
import { GoogleGenAI, Type, Modality, type GenerateContentResponse } from "@google/genai";
import type { ChatMessage, Category, Transaction, Goal } from "../types";
import { TransactionType } from '../types';

// No Vite, usamos import.meta.env para acessar as variáveis
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

// Inicializamos o SDK. Se a chave estiver vazia, as chamadas de função retornarão erro gracioso.
const ai = new GoogleGenAI({ apiKey });

export type ChatbotResponse = {
  text?: string;
  functionCall?: {
    name: string;
    args: any;
  };
};

export const chatWithBot = async (
  currentMessage: string,
  history: ChatMessage[],
  context: {
    transactions: Transaction[];
    totalBalance: number;
    goals: Goal[];
    categories: Category[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  }
): Promise<ChatbotResponse> => {
  const systemInstruction = `Você é o 'Finanças Pro Bot', um especialista em gestão financeira. 
Hoje é ${new Date().toLocaleDateString('pt-BR')}.
Saldo atual: R$ ${context.totalBalance.toFixed(2)}.

REGRAS DE OURO:
1. INTERPRETAÇÃO: Se o usuário disser "gastei X na pizzaria", entenda como Despesa, Categoria "Alimentação" (ID: food), Descrição "Pizzaria".
2. MÉTODO DE PAGAMENTO: Se não for informado, use "Outro". Se disser "no pix", use "PIX".
3. INFORMAÇÃO FALTANTE: Se o usuário disser "ganhei 20 reais" mas não disser DE QUE ou QUAL A DESCRIÇÃO, você NÃO deve registrar. Em vez disso, pergunte educadamente: "Entendido! Registrarei os 20 reais agora. Poderia me dizer qual a descrição ou origem desse valor (ex: presente, bônus, venda)?"
4. CATEGORIAS DISPONÍVEIS (USE OS IDs):
${context.categories.map(c => `- ${c.name}: ID "${c.id}"`).join('\n')}

Se todos os dados (Tipo, Valor, Descrição, Categoria) estiverem claros, chame 'createTransaction'. 
Caso contrário, responda apenas com texto perguntando o que falta.`;

  const geminiHistory = history.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: String(msg.text) }]
  }));

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...geminiHistory, { role: 'user', parts: [{ text: String(currentMessage) }] }],
        config: {
            systemInstruction: systemInstruction,
            tools: [{
                functionDeclarations: [{
                    name: 'createTransaction',
                    description: 'Registra uma nova transação financeira no sistema quando todos os dados essenciais estão presentes.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['receita', 'despesa', 'investimento'] },
                            amount: { type: Type.NUMBER, description: 'Valor numérico positivo' },
                            description: { type: Type.STRING, description: 'Descrição clara do lançamento' },
                            categoryId: { type: Type.STRING, description: 'ID da categoria' },
                            date: { type: Type.STRING, description: 'Data ISO AAAA-MM-DD' },
                            paymentMethod: { type: Type.STRING, description: 'Forma de pagamento (PIX, Dinheiro, etc)' }
                        },
                        required: ['type', 'amount', 'description', 'categoryId', 'date', 'paymentMethod'],
                    },
                }]
            }]
        }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
        return { 
            functionCall: { 
                name: response.functionCalls[0].name, 
                args: response.functionCalls[0].args 
            } 
        };
    }

    // Fix: Access .text property directly (not as a method).
    return { text: response.text || "Entendido. Como posso ajudar com suas finanças agora?" };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Tive um problema ao me conectar com meu cérebro de IA. Tente novamente em instantes." };
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    try {
        const base64Data = await blobToBase64(audioBlob);
        // Limpar o mimeType para ser um tipo IANA básico que o Gemini aceita (audio/webm, audio/mp4, etc)
        let mimeType = audioBlob.type.split(';')[0];
        if (mimeType === 'audio/x-m4a') mimeType = 'audio/mp4';
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: "Você é um transcritor. Transcreva este áudio exatamente como foi falado, em Português do Brasil. Se o áudio for sobre gastos ou ganhos, apenas transcreva as palavras. Não responda à pergunta, apenas escreva o texto." }
                ]
            }]
        });
        
        // Fix: Access .text property directly.
        const text = response.text;
        return text ? text.trim() : "";
    } catch (error) {
        console.error("Audio transcription error:", error);
        throw error;
    }
};

export const extractReceiptInfo = async (base64Image: string, mimeType: string, categories: Category[]): Promise<any | null> => {
    try {
        const categoryList = categories.map(c => `${c.id}: ${c.name}`).join(', ');
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: `Extraia informações deste recibo e retorne um JSON. Escolha a categoria mais adequada desta lista: ${categoryList}.` }
            ]},
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        date: { type: Type.STRING },
                        categoryId: { type: Type.STRING }
                    },
                    required: ["description", "amount", "date", "categoryId"]
                },
            }
        });
        // Fix: Access .text property directly.
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Receipt extraction error:", error);
        return null;
    }
};

export const estimateGoalCost = async (fullPrompt: string): Promise<{ breakdown: string; totalAmount: number; sources: any[] }> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Você é um Assistente Especialista em Planejamento de Metas Financeiras e Pessoais. 
Com base nas informações detalhadas da meta: "${fullPrompt}".

Sua tarefa é:
1. Pesquisar valores atuais e reais na internet (preços recentes e compatíveis com o mercado atual). Nunca utilize estimativas genéricas ou antigas.
2. Estruturar a resposta obrigatoriamente com:
   - 1. Resumo da meta.
   - 2. Detalhamento dos custos por categoria com explicações específicas baseadas no contexto (se for viagem, inclua hospedagem, comidas e passeios locais como um guia turístico).
   - 3. Valor Total Estimado: R$ X,XX (Mantenha exatamente este termo no final).

Seja claro, organizado e didático.`,
            config: { tools: [{ googleSearch: {} }] },
        });
        // Fix: Access .text property directly.
        const responseText = String(response.text || "");
        let totalAmount = 0;
        const match = responseText.match(/Valor Total Estimado:?\s*R\$\s*([\d.,]+)/i);
        if (match && match[1]) {
            totalAmount = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        }
        return { 
            breakdown: responseText, 
            totalAmount: isNaN(totalAmount) ? 0 : totalAmount, 
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [] 
        };
    } catch (error) {
        console.error("Goal estimation error:", error);
        return { breakdown: "Erro na estimativa da IA.", totalAmount: 0, sources: [] };
    }
};

export const askClarifyingQuestions = async (description: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é um Assistente Especialista em Planejamento de Metas Financeiras e Pessoais.
O usuário informou a seguinte meta: "${description}".
Sua função é ajudar a transformar essa meta vaga em algo claro e mensurável. 
Gere de 3 a 4 perguntas curtas, diretas e altamente relevantes (ex: destino, modelo, duração, padrão de qualidade) para ajudar a estimar o custo com precisão. 
Evite perguntas genéricas; foque no que impacta o preço final.
Retorne apenas as perguntas, uma por linha, sem numeração ou introdução.`
        });
        // Fix: Access .text property directly.
        return (response.text || "").split('\n').filter(l => l.trim().length > 3).slice(0, 4);
    } catch (error) {
        console.error("Clarifying questions error:", error);
        return ["Quais são os principais custos?", "Para quando você planeja?", "Existem detalhes extras?"];
    }
};
