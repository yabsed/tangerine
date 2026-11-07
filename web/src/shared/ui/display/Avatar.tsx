import { Avatar as MantineAvatar } from '@mantine/core';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ src, alt = 'Profile', size = 'md', className = '' }: AvatarProps) {
  const px = size === 'sm' ? 40 : size === 'md' ? 64 : size === 'lg' ? 96 : 120;

  return (
    <MantineAvatar src={src} alt={alt} size={px} radius="xl" className={className} color="gray" />
  );
}
