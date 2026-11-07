import { useState, useRef } from 'react';
import { payApi } from '@/features/pay/api/payApi';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/features/user/hooks/useUser';
import { transactionKeys } from '@/features/pay/hooks/useTransactions';
import { useTranslation } from '@/shared/i18n';

interface UseTransferOptions {
  currentCoin: number;
}

export const useTransfer = ({ currentCoin }: UseTransferOptions) => {
  const queryClient = useQueryClient();
  const t = useTranslation();
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const requestKeyRef = useRef<string>(crypto.randomUUID());

  const transfer = async (receiveUserId: string, receiverNickname?: string) => {
    const amount = parseInt(transferAmount, 10);
    if (!receiveUserId || !amount || amount <= 0) {
      alert(t.pay.invalidAmount);
      return false;
    }
    if (currentCoin < amount) {
      alert(t.pay.insufficientBalance);
      return false;
    }

    setTransferring(true);
    try {
      await payApi.transfer({
        amount,
        description: `${t.pay.transferTo} ${receiverNickname || t.chat.otherParty} ${amount.toLocaleString()}${t.common.won}`,
        request_key: requestKeyRef.current,
        receive_user_id: receiveUserId,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      setTransferAmount('');
      setShowTransferMenu(false);
      alert(`${amount.toLocaleString()}${t.pay.transferSuccess}`);
      requestKeyRef.current = crypto.randomUUID();
      return true;
    } catch (err) {
      console.error('Transfer failed:', err);
      alert(t.pay.transferFailed);
      return false;
    } finally {
      setTransferring(false);
    }
  };

  const toggleTransferMenu = () => setShowTransferMenu(!showTransferMenu);

  const addAmount = (amount: number) => {
    setTransferAmount(String((parseInt(transferAmount, 10) || 0) + amount));
  };

  const resetRequestKey = () => {
    requestKeyRef.current = crypto.randomUUID();
  };

  return {
    showTransferMenu,
    transferAmount,
    transferring,
    setTransferAmount,
    transfer,
    toggleTransferMenu,
    addAmount,
    resetRequestKey,
  };
};
