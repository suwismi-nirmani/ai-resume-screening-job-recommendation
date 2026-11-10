
import { useEffect, useState } from "react";

import { api } from "../../api.js";
import { Alert, Loading, PageHeader } from "../../components/ui.jsx";
import { CategoryCard } from "./DashboardPage.jsx";

export default function CategoriesPage() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCategories().then(setCategories).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Popular Job Categories" }]}
        title="Popular Job Categories"
        subtitle="Explore job opportunities in top fields."
      />

      <Alert>{error}</Alert>

      {!categories && !error && <Loading />}

      <div className="category-grid five">
        {categories?.map((category) => (
          <CategoryCard key={category.slug} category={category} showArrow />
        ))}
      </div>
    </div>
  );
}
