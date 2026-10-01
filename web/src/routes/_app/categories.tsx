import { createFileRoute } from '@tanstack/react-router';

import { CategoriesPage } from '@/components/categories/categories-page';

export const Route = createFileRoute('/_app/categories')({
  component: CategoriesPage,
});
