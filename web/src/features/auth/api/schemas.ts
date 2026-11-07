import { z } from 'zod';

// Reusable field schemas
const email = z.string()
  .min(1, '이메일을 입력해주세요.')
  .email('올바른 이메일 형식을 입력해주세요.');

const password = z.string()
  .min(1, '비밀번호를 입력해주세요.');

const passwordWithLength = z.string()
  .min(1, '비밀번호를 입력해주세요.')
  .min(8, '비밀번호는 8자 이상이어야 합니다.');

// Login schema
export const loginSchema = z.object({
  email,
  password,
});

// Signup schema (extends with password confirmation)
export const signupSchema = z.object({
  email,
  password: passwordWithLength,
  passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
});

// Type inference (replaces manual interface definitions)
export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
