import axios from "axios";

export const fetchCartFromDB = async (token) => {
  const { data } = await axios.get("/api/cart/get", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const saveCartToDB = async (token, cartItems) => {
  try {
    await axios.post("/api/cart/update", 
      { cartdata: cartItems }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (err) {
    console.error("❌ Failed to save cart:", err.message);
    throw err; // re-throw so callers know the sync failed and can inform the user
  }
};