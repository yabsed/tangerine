import { Center, Pagination as MantinePagination } from '@mantine/core';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Center mt="lg">
      <MantinePagination
        value={currentPage}
        total={totalPages}
        onChange={onPageChange}
        color="orange"
        radius="md"
      />
    </Center>
  );
}
