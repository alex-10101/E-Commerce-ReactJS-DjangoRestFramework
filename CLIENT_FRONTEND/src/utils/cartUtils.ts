const SHIPPING_PRICE_THERSHOLD = 100;
const SHIPPING_PRICE = 10;
const TAX_PRICE = 0.082;

function addDecimals(num: number) {
  return (Math.round(num * 100) / 100).toFixed(2);
}

export function updateCart(state: any) {
  // Calculate the items price in whole number (pennies) to avoid issues with
  // floating point number calculations
  const itemsPrice = state.cartItems.reduce(
    (acc: any, item: any) => acc + (item.price * 100 * item.qty) / 100,
    0
  );
  state.itemsPrice = addDecimals(itemsPrice);

  // Calculate the shipping price
  const shippingPrice =
    itemsPrice > SHIPPING_PRICE_THERSHOLD ? 0 : SHIPPING_PRICE;
  state.shippingPrice = addDecimals(shippingPrice);

  // Calculate the tax price
  const taxPrice = TAX_PRICE * itemsPrice;
  state.taxPrice = addDecimals(taxPrice);

  const totalPrice = itemsPrice + shippingPrice + taxPrice;
  // Calculate the total price
  state.totalPrice = addDecimals(totalPrice);

  // Save the cart to localStorage
  localStorage.setItem("cart", JSON.stringify(state.cartItems));
  // localStorage.setItem("cart", JSON.stringify(state));

  return state;
}
