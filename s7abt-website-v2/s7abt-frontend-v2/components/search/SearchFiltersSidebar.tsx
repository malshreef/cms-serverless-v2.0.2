'use client';

import { useLocale } from 'next-intl';

interface FilterOption {
  id: string | number;
  name: string;
  count: number;
}

interface SearchFiltersSidebarProps {
  categories: FilterOption[];
  authors: FilterOption[];
  selectedCategories: (string | number)[];
  selectedAuthors: (string | number)[];
  onCategoryChange: (categoryId: string | number) => void;
  onAuthorChange: (authorId: string | number) => void;
}

export default function SearchFiltersSidebar({
  categories,
  authors,
  selectedCategories,
  selectedAuthors,
  onCategoryChange,
  onAuthorChange,
}: SearchFiltersSidebarProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-2xl border border-border-blue p-6 shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-6 flex items-center">
          <i className={`fas fa-filter text-sky-cta ${isRTL ? 'ml-2' : 'mr-2'}`}></i>
          {isRTL ? 'المرشحات' : 'Filters'}
        </h3>

        <div className="space-y-6">
          {/* Categories Filter */}
          {categories.length > 0 && (
            <div>
              <h4 className="font-semibold text-charcoal mb-4">
                {isRTL ? 'الفئات' : 'Categories'}
              </h4>
              <div className="space-y-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => onCategoryChange(category.id)}
                      className="rounded border-border-blue text-sky-cta focus:ring-sky-cta transition-all"
                    />
                    <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-sm text-muted-blue group-hover:text-sky-cta transition-colors`}>
                      {category.name} ({category.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Authors Filter */}
          {authors.length > 0 && (
            <div className="border-t border-border-blue pt-6">
              <h4 className="font-semibold text-charcoal mb-4">
                {isRTL ? 'الكتاب' : 'Authors'}
              </h4>
              <div className="space-y-3">
                {authors.map((author) => (
                  <label
                    key={author.id}
                    className="flex items-center cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAuthors.includes(author.id)}
                      onChange={() => onAuthorChange(author.id)}
                      className="rounded border-border-blue text-sky-cta focus:ring-sky-cta transition-all"
                    />
                    <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-sm text-muted-blue group-hover:text-sky-cta transition-colors`}>
                      {author.name} ({author.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

