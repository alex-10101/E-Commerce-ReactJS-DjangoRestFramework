import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { updateCart } from "../../utils/cartUtils";
import type { IProduct, IShippingAddress } from "../../types/types";

export type CartItem = Omit<IProduct, "user" | "rating" | "numReviews"> & {
  qty: number;
};

export type ShippingAddress = Pick<
  IShippingAddress,
  "address" | "city" | "postalCode" | "country"
>;

interface IInitialState {
  // cartItems: (Omit<IProduct, "user" | "rating" | "numReviews"> & { qty: number;})[]; // the "(...)" are required here
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

// this also adds keys for shipping address and other fields in the local storage
// const initialState: IInitialState = localStorage.getItem("cart")
//   ? JSON.parse(localStorage.getItem("cart")!)
//   : {
//       cartItems: [],
//       shippingAddress: { address: "", city: "", postalCode: "", country: "" },
//       paymentMethod: "PayPal",
//     };

const initialState: IInitialState = {
  cartItems: JSON.parse(localStorage.getItem("cart")!) ?? [],
  shippingAddress: { address: "", city: "", postalCode: "", country: "" },
  paymentMethod: "PayPal",
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /**
     * Function which adds items to the shopping cart.
     * @param state
     * @param action
     * @returns
     */
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const item = action.payload;

      // Check if a product already is in the shopping cart
      const existItem = state.cartItems.find(
        (itemInCart) => itemInCart.id === item.id,
      );

      // If the product is already in the shopping cart,
      // update the product in the shopping cart with the new, updated  item.
      // The updated item is the same as the existing item, but with an updated quantity.
      if (existItem) {
        state.cartItems = state.cartItems.map((itemInCart) =>
          itemInCart.id === existItem.id ? item : itemInCart,
        );
      }
      // If the product is not already in the shopping cart,
      // copy all previous products in a list and append the new product at the end of the list.
      else {
        state.cartItems = [...state.cartItems, item];
      }

      return updateCart(state);
    },

    /**
     * Function which removes an item from the cart.
     * @param state
     * @param action
     * @returns
     */
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (item) => item.id !== action.payload,
      );
      return updateCart(state);
    },

    /**
     * Function which saves the shipping address in the global store
     * and to the browser's local storage.
     * @param state
     * @param action
     */
    saveShippingAddress: (
      state,
      action: PayloadAction<
        Pick<IShippingAddress, "address" | "city" | "postalCode" | "country">
      >,
    ) => {
      state.shippingAddress = action.payload;
      // localStorage.setItem("cart", JSON.stringify(state));
    },

    /**
     * Function which saves the users' payment method in the global store
     * and to the browser's local storage.
     * @param state
     * @param action
     */
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      // localStorage.setItem("cart", JSON.stringify(state));
    },

    /**
     * Function which removes all items from the shopping cart.
     * @param state
     * @param _action
     */
    clearCartItems: (state) => {
      state.cartItems = [];
      localStorage.setItem("cart", JSON.stringify([]));
      // localStorage.setItem("cart", JSON.stringify(state));
    },

    /**
     * Function which resets the shopping cart state when the user logs out.
     * This function clears the state without clearing the local storage.
     * @param state
     * @returns
     */
    resetCart: (_state) => initialState,
  },
});

export const {
  addToCart,
  removeFromCart,
  saveShippingAddress,
  savePaymentMethod,
  clearCartItems,
  resetCart,
} = cartSlice.actions;

export default cartSlice.reducer;
