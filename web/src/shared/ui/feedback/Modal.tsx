import React from 'react';
import { Modal as MantineModal } from '@mantine/core';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <MantineModal
      opened={isOpen}
      onClose={onClose}
      title={title}
      centered
      closeOnEscape
      closeOnClickOutside
      withCloseButton={Boolean(title)}
      overlayProps={{ backgroundOpacity: 0.55, blur: 2 }}
    >
      {children}
    </MantineModal>
  );
}
