// Decodifica uma string base64 para um Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodifica dados de áudio PCM brutos para um AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Converte os dados brutos (Uint8Array) para Int16Array
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normaliza a amostra de 16-bit para o intervalo de -1.0 a 1.0
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

// Obtém ou cria uma instância singleton de AudioContext
const getAudioContext = (): AudioContext => {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
};

// Função principal para reproduzir o áudio a partir de uma string base64
export const playAudio = async (base64Audio: string): Promise<void> => {
    try {
        const ctx = getAudioContext();
        // O AudioContext pode ser suspenso por políticas de autoplay do navegador
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();

        // Retorna uma promessa que resolve quando o áudio termina de tocar
        return new Promise<void>(resolve => {
            source.onended = () => {
                resolve();
            };
        });
    } catch (error) {
        console.error("Falha ao reproduzir áudio:", error);
    }
};
