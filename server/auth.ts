import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  console.log('Gerando hash para senha:', password ? '***' : undefined);
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log('Hash gerado:', hash);
  return hash;
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  console.log('Comparando senhas...');
  console.log('Senha fornecida:', password ? '***' : undefined);
  console.log('Hash armazenado:', hash);
  const result = await bcrypt.compare(password, hash);
  console.log('Resultado da comparação:', result);
  return result;
} 