import { createFileRoute } from '@tanstack/react-router';

import { Page } from '@/components/page';
import { en } from '@/locales/en';

export const Route = createFileRoute('/_app/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <Page title={en.categories.title}>
      <p className="text-muted-foreground">{en.categories.placeholder}</p>
    </Page>
  );
}
