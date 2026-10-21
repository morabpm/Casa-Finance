// Utilitários de anexos (comprovantes/fotos).
//
// Resolve 3 problemas do app original:
//  1) Fotos do celular (2–6 MB) eram recusadas pelo limite fixo de 1 MB  -> agora imagens são
//     comprimidas automaticamente (redimensiona + JPEG) antes de salvar.
//  2) Leitura de arquivo sem tratamento de erro: se o FileReader falhasse, a Promise ficava
//     pendurada para sempre e nada acontecia na tela.
//  3) Baixar/abrir usando link "data:" gigante falha em vários navegadores (Chrome bloqueia
//     navegação para data: e limita o tamanho). Agora convertemos para Blob e usamos blob: URL.

import { Attachment } from './types';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;      // arquivo original aceito: até 10 MB
export const TARGET_IMAGE_BYTES = 800 * 1024;         // meta de tamanho de foto após compressão
const MAX_IMAGE_SIDE = 1600;                          // lado maior da imagem, em pixels

const readAsDataURL = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 0) resolve(reader.result);
      else reject(new Error('Arquivo vazio ou ilegível.'));
    };
    reader.onerror = () => reject(reader.error || new Error('Erro ao ler o arquivo.'));
    reader.onabort = () => reject(new Error('Leitura do arquivo cancelada.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
    img.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', quality));

// Comprime uma imagem. Se algo der errado (ou ficar maior que o original), devolve o original.
const compressImage = async (file: File): Promise<Blob> => {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff'; // PNG transparente vira fundo branco no JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    let quality = 0.85;
    let blob = await canvasToBlob(canvas, quality);
    while (blob && blob.size > TARGET_IMAGE_BYTES && quality > 0.4) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, quality);
    }
    if (!blob || blob.size >= file.size) return file;
    return blob;
  } catch {
    return file; // ex.: HEIC que o navegador não decodifica -> guarda o original
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export interface ProcessResult {
  attachments: Attachment[];
  errors: string[];
}

// Processa os arquivos escolhidos pelo usuário. Nunca lança erro: devolve o que deu certo
// e a lista de mensagens do que falhou.
export const processFiles = async (files: File[]): Promise<ProcessResult> => {
  const attachments: Attachment[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size === 0) {
      errors.push(`"${file.name}" está vazio.`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`"${file.name}" tem ${(file.size / 1024 / 1024).toFixed(1)} MB e passa do limite de ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
      continue;
    }
    try {
      const isImage = file.type.startsWith('image/') && file.type !== 'image/gif' && file.type !== 'image/svg+xml';
      const blob: Blob = isImage ? await compressImage(file) : file;
      const url = await readAsDataURL(blob);
      const converted = blob !== file;
      attachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        name: converted ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : file.name,
        type: converted ? 'image/jpeg' : (file.type || 'application/octet-stream'),
        size: blob.size,
        url,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err) {
      errors.push(`Não foi possível anexar "${file.name}": ${err instanceof Error ? err.message : 'erro desconhecido'}.`);
    }
  }
  return { attachments, errors };
};

// Converte "data:...;base64,..." em Blob (sem usar fetch, que pode ser bloqueado por CSP).
export const dataUrlToBlob = (dataUrl: string, fallbackType = 'application/octet-stream'): Blob => {
  const commaIdx = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || commaIdx === -1) {
    // Já é um link normal (http/blob) — não deve acontecer neste app, mas evitamos quebrar.
    throw new Error('Anexo em formato inesperado.');
  }
  const header = dataUrl.slice(5, commaIdx);
  const isBase64 = header.includes(';base64');
  const mime = header.split(';')[0] || fallbackType;
  const body = dataUrl.slice(commaIdx + 1);
  if (!isBase64) return new Blob([decodeURIComponent(body)], { type: mime });

  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

// Baixa o anexo como arquivo.
export const downloadAttachment = (att: Attachment) => {
  const blob = dataUrlToBlob(att.url, att.type);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = att.name || 'anexo';
  document.body.appendChild(a); // Firefox exige o link estar no DOM
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

// Abre o anexo em uma nova aba (imagens e PDFs aparecem direto no navegador).
export const openAttachment = (att: Attachment) => {
  const blob = dataUrlToBlob(att.url, att.type);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Pop-up bloqueado: cai para download.
    URL.revokeObjectURL(url);
    downloadAttachment(att);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
};