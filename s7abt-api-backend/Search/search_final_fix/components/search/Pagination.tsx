'use client';

import { useLocale } from 'next-intl';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex justify-center pt-12">
      <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-border-blue rounded-lg hover:bg-sky-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className={`fas fa-chevron-${isRTL ? 'right' : 'left'}`}></i>
        </button>

        {/* Page Numbers */}
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-4 py-2 text-muted-blue">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                isActive
                  ? 'bg-sky-cta text-white shadow-md'
                  : 'border border-border-blue hover:bg-sky-bg text-charcoal'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-border-blue rounded-lg hover:bg-sky-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className={`fas fa-chevron-${isRTL ? 'left' : 'right'}`}></i>
        </button>
      </div>
    </div>
  );
}

