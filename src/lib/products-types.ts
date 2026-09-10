export interface ProductForCard {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  images: string[];
  isVeg: boolean;
  weightGrams: number;
  sellingPricePaise: number;
  isFeatured: boolean;
  categoryName?: string;
}
