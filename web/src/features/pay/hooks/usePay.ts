import { payApi } from '@/features/pay/api/payApi';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/features/user/hooks/useUser';
import { transactionKeys } from '@/features/pay/hooks/useTransactions';
import { useTranslation } from '@/shared/i18n';

export const usePay = () => {
  const queryClient = useQueryClient();
  const t = useTranslation();

  const deposit = async (amount: number, requestKey: string): Promise<boolean> => {
    try {
      await payApi.deposit({
        amount,
        description: `Deus ex Machina ${t.pay.depositDesc} ${amount.toLocaleString()}${t.common.won}`,
        request_key: requestKey,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      return true;
    } catch (err) {
      console.error(err);
      alert(t.pay.depositError);
      return false;
    }
  };

  const withdraw = async (amount: number, currentCoin: number, requestKey: string): Promise<boolean> => {
    if (currentCoin < amount) {
      alert(t.pay.insufficientBalance);
      return false;
    }
    try {
      await payApi.withdraw({
        amount,
        description: `Deus ex Machina ${t.pay.withdrawDesc} ${amount.toLocaleString()}${t.common.won}`,
        request_key: requestKey,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      return true;
    } catch (err) {
      console.error(err);
      alert(t.pay.withdrawError);
      return false;
    }
  };

  return { deposit, withdraw };
};
