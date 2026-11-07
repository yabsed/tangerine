import { useRef } from 'react';
import { useUser } from '@/features/user/hooks/useUser';
import { usePay } from '@/features/pay/hooks/usePay';

export const useMyPay = () => {
  // user, pay
  const { user } = useUser();
  const { deposit, withdraw } = usePay();
  // idempotent 
  const depositKeyRef = useRef<string>(crypto.randomUUID());
  const withdrawKeyRef = useRef<string>(crypto.randomUUID());

  const depositCoin = async (amount: number) => {
    const success = await deposit(amount, depositKeyRef.current);
    if (success) {
      depositKeyRef.current = crypto.randomUUID();
    }
  };

  const withdrawCoin = async (amount: number) => {
    if (!user) return;
    const success = await withdraw(amount, user.coin, withdrawKeyRef.current);
    if (success) {
      withdrawKeyRef.current = crypto.randomUUID();
    }
  };

  return { depositCoin, withdrawCoin };
};
