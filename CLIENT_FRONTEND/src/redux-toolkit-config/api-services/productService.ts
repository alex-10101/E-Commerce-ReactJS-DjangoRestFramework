import type {
  IProduct,
  IProductFilterOptions,
  PaginatedProductResponse,
} from "../../types/types";
import { apiSlice } from "../apiSlice";

// Extend the base apiSlice with item-specific endpoints
export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // /**
    //  * Service for retrieving all products.
    //  */
    // getAllProducts: builder.query<IProduct[], string>({
    //   query: (url) => ({ url: `/products/get/${url}`, method: "GET" }),
    //   providesTags: (result) =>
    //     result
    //       ? [
    //           ...result.map(({ id }) => ({ type: "products", id }) as const),
    //           { type: "products", id: "LIST" },
    //         ]
    //       : [{ type: "products", id: "LIST" }],
    // }),

    /**
     * Service for retrieving all products using query params.
     */
    getAllProducts: builder.query<PaginatedProductResponse, string>({
      query: (url) => ({
        url: `/products/get/`,
        method: "GET",
        params: Object.fromEntries(new URLSearchParams(url)),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.products.map(
                ({ id }) => ({ type: "products", id }) as const,
              ),
              { type: "products", id: "LIST" },
            ]
          : [{ type: "products", id: "LIST" }],
    }),

    /**
     * Service for retrieving a single product.
     */
    getProduct: builder.query<IProduct, number>({
      query: (id) => ({ url: `/products/get/${id}/`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "products", id }],
    }),

    /**
     * Service for adding a new product.
     */
    createProduct: builder.mutation<any, FormData>({
      query: (body) => ({
        url: "/products/create/",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "products", id: "LIST" },
        { type: "products", id: "FILTERS" },
      ],
    }),

    /**
     * Service for updating a product.
     */
    updateProduct: builder.mutation<
      void,
      {
        id: number;
        formData: FormData;
      }
    >({
      query: ({ id, formData }) => ({
        url: `/products/update/${id}/`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "products", id },
        { type: "products", id: "FILTERS" },
      ],
    }),

    /**
     * Service for deleting a product.
     */
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `/products/delete/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "products", id },
        { type: "products", id: "LIST" },
        { type: "products", id: "FILTERS" },
      ],
    }),

    /**
     * Service for deleting a gallery image of a product.
     */
    deleteGalleryImage: builder.mutation<
      void,
      { productId: number; imageId: number }
    >({
      query: ({ productId, imageId }) => ({
        url: `/products/delete/${productId}/gallery/${imageId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { productId }) => [
        { type: "products", id: productId },
      ],
    }),

    /**
     * Service for creating a review for a product.
     */
    createReview: builder.mutation<
      void,
      {
        comment: string;
        rating: number;
        productId: number;
      }
    >({
      query: (data) => ({
        url: `products/${data.productId}/review/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "products", id: productId },
      ],
    }),

    /**
     * Service for retrieving all distinct product categories with all distinct product brands.
     */
    getProductFilterOptions: builder.query<IProductFilterOptions, void>({
      query: () => ({ url: "/products/filters/", method: "GET" }),
      providesTags: [{ type: "products", id: "FILTERS" }],
    }),
  }),
});

// Export auto-generated hooks
export const {
  useGetAllProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useDeleteGalleryImageMutation,
  useCreateReviewMutation,
  useGetProductFilterOptionsQuery,
} = productApiSlice;
