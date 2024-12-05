import { promises as fs } from 'fs';
import path from 'path';

const CONVERSATIONS_DIR = path.join(process.cwd(), 'conversations');

export const saveConversation = async (id: string, messages: any[]) => {
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(messages, null, 2));
};

export const loadConversation = async (id: string): Promise<any[]> => {
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`File not found for conversation ${id}`);
      return [];
    } else {
      console.error(`Error loading conversation ${id}:`, error);
      return [];
    }
  }
};

export async function getConversation(id: string) {
  const filePath = path.join(process.cwd(), 'conversations', `${id}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading conversation ${id}:`, error);
    return null;
  }
}

export const getAllConversations = async (): Promise<{ id: string; preview: string }[]> => {
  try {
    await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
    const files = await fs.readdir(CONVERSATIONS_DIR);
    const conversations = await Promise.all(files.map(async (file) => {
      const id = path.parse(file).name;
      const data = await loadConversation(id);
      const preview = data.length > 0 ? data[0].content[0]['text'] + '...' : 'Empty conversation';
      return { id, preview };
    }));
    return conversations;
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
};