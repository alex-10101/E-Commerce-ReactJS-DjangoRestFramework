export interface IProductGalleryImage {
  id: number;
  image_url: string; // absolute URL for carousel/slider
  alt_text: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  id: number;
  user: number;
  name: string;
  description: string;
  brand: string;
  category: string;
  cover_img: string; // Cover image raw field (relative URL) (used for listings / home page)
  cover_url: string; // Cover image absolute URL (preferred for frontend) (used for listings / home page)
  gallery_images: IProductGalleryImage[]; // Gallery images (used for carousel/slider)
  price: number;
  countInStock: number;
  rating: number;
  numReviews: number;
  reviews: IReview[];
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  id: number;
  product: number;
  user: number;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrder {
  id: number;
  user: number;
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  paidAt: string;
  delveredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  id: number;
  product: number;
  order: number;
  name: string;
  qty: number;
  price: number;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface IShippingAddress {
  id: number;
  order: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: number;
  email: string;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  date_joined: string;
  groups: any[];
  user_permissions: any[];
}

export interface IOrderResponse {
  id: number;
  orderItems: IOrderItem[];
  shippingAddress: IShippingAddress;
  user: IUser;
  paymentMethod: string;
  taxPrice: string;
  shippingPrice: string;
  totalPrice: string;
  isPaid: boolean;
  isDelivered: boolean;
  paidAt: string;
  delveredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProductFilterOptions {
  brands: string[];
  categories: string[];
}

export type PaginatedProductResponse = {
  pages: number;
  page: number;
  products: IProduct[];
};
