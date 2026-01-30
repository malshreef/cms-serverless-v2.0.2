'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

interface PaginationProps {
    totalPages: number;
    currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    // Logic to show a window of pages (e.g., 1 ... 4 5 6 ... 10)
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Always show first page
            pageNumbers.push(1);

            // Calculate start and end of the window around current page
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if near the start
            if (currentPage <= 3) {
                endPage = Math.min(totalPages - 1, 4);
            }

            // Adjust if near the end
            if (currentPage >= totalPages - 2) {
                startPage = Math.max(2, totalPages - 3);
            }

            // Add ellipsis before window if needed
            if (startPage > 2) {
                pageNumbers.push('...');
            }

            // Add window pages
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            // Add ellipsis after window if needed
            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }

            // Always show last page
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center space-x-2 rtl:space-x-reverse mt-12">
            {/* Previous Button */}
            <Link
                href={createPageURL(currentPage - 1)}
                className={`px-4 py-2 rounded-lg border ${currentPage <= 1
                        ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-sky-cta border-gray-300'
                    } transition-colors`}
                aria-disabled={currentPage <= 1}
            >
                <i className={`fa-solid fa-chevron-${isRTL ? 'right' : 'left'}`}></i>
            </Link>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => {
                if (page === '...') {
                    return (
                        <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">
                            ...
                        </span>
                    );
                }

                return (
                    <Link
                        key={page}
                        href={createPageURL(page)}
                        className={`px-4 py-2 rounded-lg border font-medium transition-colors ${currentPage === page
                                ? 'bg-sky-cta text-white border-sky-cta'
                                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-sky-cta border-gray-300'
                            }`}
                    >
                        {page}
                    </Link>
                );
            })}

            {/* Next Button */}
            <Link
                href={createPageURL(currentPage + 1)}
                className={`px-4 py-2 rounded-lg border ${currentPage >= totalPages
                        ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-sky-cta border-gray-300'
                    } transition-colors`}
                aria-disabled={currentPage >= totalPages}
            >
                <i className={`fa-solid fa-chevron-${isRTL ? 'left' : 'right'}`}></i>
            </Link>
        </div>
    );
}
