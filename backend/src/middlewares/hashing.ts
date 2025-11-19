import { hash, compare } from "bcryptjs";

// Hashear un valor (contraseña)
export const doHash = async (value: string, saltValue: number): Promise<string> => {
  const result = await hash(value, saltValue);
  return result;
};

// Validar un valor contra un hash existente
export const doHashValidation = async (value: string, hashedValue: string): Promise<boolean> => {
  const result = await compare(value, hashedValue);
  return result;
};
