import type { IOrderResponse } from "../../types/types";
import type { CartItem, ShippingAddress } from "../slices/cartSlice";
import { apiSlice } from "../apiSlice";

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<
      IOrderResponse,
      {
        orderItems: CartItem[];
        shippingAddress: ShippingAddress;
        paymentMethod: string;
      }
    >({
      query: (order) => ({
        url: "/orders/",
        method: "POST",
        body: order,
      }),

      invalidatesTags: [
        { type: "orders", id: "MyOrdersLIST" },
        { type: "orders", id: "AllOrdersLIST" },
      ],
    }),

    getOrderDetails: builder.query<IOrderResponse, number>({
      query: (id) => ({
        url: `/orders/${id}/`,
      }),
      providesTags: (_result, _err, id) => [{ type: "orders", id }],
    }),

    getMyOrders: builder.query<IOrderResponse[], void>({
      query: () => ({
        url: `/orders/`,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "orders", id }) as const),
              { type: "orders", id: "MyOrdersLIST" },
            ]
          : [{ type: "orders", id: "MyOrdersLIST" }],
    }),

    getOrders: builder.query<IOrderResponse[], void>({
      query: () => ({
        url: "/orders/",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "orders", id }) as const),
              { type: "orders", id: "AllOrdersLIST" },
            ]
          : [{ type: "orders", id: "AllOrdersLIST" }],
    }),

    deliverOrder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/orders/${id}/deliver/`,
        method: "PUT",
      }),

      invalidatesTags: (_res, _err, id) => [
        { type: "orders", id },
        { type: "orders", id: "MyOrdersLIST" },
        { type: "orders", id: "AllOrdersLIST" },
      ],
    }),

    markOrderAsPaid: builder.mutation<void, number>({
      query: (id) => ({
        url: `/orders/${id}/`,
        method: "PUT",
      }),

      invalidatesTags: (_res, _err, id) => [
        { type: "orders", id },
        { type: "orders", id: "MyOrdersLIST" },
        { type: "orders", id: "AllOrdersLIST" },
      ],
    }),

    createStripeCheckoutSession: builder.mutation<{ url: string }, number>({
      query: (orderId) => ({
        url: `/orders/${orderId}/stripe/create-checkout-session/`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderDetailsQuery,
  useGetMyOrdersQuery,
  useGetOrdersQuery,
  useDeliverOrderMutation,
  useMarkOrderAsPaidMutation,
  useCreateStripeCheckoutSessionMutation,
} = orderApiSlice;
