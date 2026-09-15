"use client";

import { useRouter } from "next/navigation";
import { selectCartCount, selectCartAmount } from "@/app/redux/selectors/cartselecters";
import { selectAllProducts } from "@/app/redux/selectors/productSelectors";
import { setCartItem } from "@/app/redux/slices/CartSlice";
import { TAX_RATE } from "@/lib/pricing";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/nextjs"; // ✅ Correct for Next.js
import axios from "axios";
import toast from "react-hot-toast";
import FullScreenLoader from "./FullScreenLoader";
import PaymentErrorScreen from "./PaymentErrorScreen";


const OrderSummary = () => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
  const router = useRouter();
  
  // Using memoized selectors for better performance
  const products = useSelector(selectAllProducts);
  const getCartCount = useSelector(selectCartCount);
  const getCartAmount = useSelector(selectCartAmount);
  const cartItems = useSelector((state) => state.cart.items);

  const dispatch = useDispatch();
  const { getToken } = useAuth(); // ✅ needed for backend API auth
  const { user, isLoaded } = useUser(); // ✅ replaces Redux user

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Stable idempotency key for the CURRENT COD attempt. Generated lazily and kept in a
  // ref so a rapid double-click reuses the SAME key (server dedupes → no duplicate order);
  // reset to null after a successful order so the next distinct order gets a fresh key.
  const idempotencyKeyRef = useRef(null);
  const getIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : `cod_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    return idempotencyKeyRef.current;
  };

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/get-address", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to load addresses");
    }
  };

  useEffect(() => {
    if (user && isLoaded) {
      fetchUserAddresses();
    }
  }, [user, isLoaded]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

 
  // Load the Razorpay Checkout script once.
  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Build the cart items array; returns null (with a toast) if invalid/empty.
  const buildCart = () => {
    if (!selectedAddress) {
      toast.error("Please select an address");
      return null;
    }
    const cartItemsArray = Object.keys(cartItems)
      .map((key) => ({ product: key, quantity: cartItems[key] }))
      .filter((item) => item.quantity > 0);
    if (cartItemsArray.length === 0) {
      toast.error("Cart is empty");
      return null;
    }
    return cartItemsArray;
  };

  const removeDeletedFromCart = async (deletedProducts, token) => {
    const updatedCart = { ...cartItems };
    deletedProducts.forEach((id) => delete updatedCart[id]);
    dispatch(setCartItem(updatedCart));
    try {
      await axios.post("/api/cart/update", { cartdata: updatedCart }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error("Failed to update cart after removing deleted products:", e);
    }
  };

  const onOrderSuccess = (message) => {
    router.push("/order-placed");
    setTimeout(() => {
      toast.success(message);
      dispatch(setCartItem({}));
      setIsPlacingOrder(false);
    }, 400);
  };

  // Online payment succeeded: clear the cart and send the user straight to that order's
  // status/tracking page (not the generic "order placed" → My Orders bounce).
  const onPaymentSuccess = (orderId) => {
    dispatch(setCartItem({}));
    toast.success("Order placed successfully");
    router.push(`/order/${orderId}`);
    // keep the loader up through the route transition
  };

  // Online payment failed (gateway failure, verification failure, or any error):
  // show the error screen and KEEP the user on the cart so they can retry.
  const onPaymentFailed = () => {
    setIsPlacingOrder(false);
    setPaymentError(true);
  };

  // Cash on Delivery checkout.
  const createOrder = async () => {
    const cartItemsArray = buildCart();
    if (!cartItemsArray) return;
    setIsPlacingOrder(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/order/create",
        { address: selectedAddress._id, items: cartItemsArray, idempotencyKey: getIdempotencyKey() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        idempotencyKeyRef.current = null; // fresh key for the next distinct order
        onOrderSuccess(data.message);
      } else {
        if (data.deletedProducts?.length > 0) await removeDeletedFromCart(data.deletedProducts, token);
        toast.error(data.message || "Order failed");
        setIsPlacingOrder(false);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  // Online checkout via Razorpay.
  const payOnline = async () => {
    const cartItemsArray = buildCart();
    if (!cartItemsArray) return;
    setIsPlacingOrder(true);
    try {
      const token = await getToken();
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      // 1) Create a Razorpay order (server computes the amount).
      const { data: orderData } = await axios.post("/api/payment/create-order", { items: cartItemsArray, address: selectedAddress._id }, authHeader);
      if (!orderData.success) {
        // Products removed mid-checkout get a specific message; anything else is a
        // generic failure → show the error screen.
        if (orderData.deletedProducts?.length > 0) {
          await removeDeletedFromCart(orderData.deletedProducts, token);
          toast.error(orderData.message || "Some products are no longer available");
          setIsPlacingOrder(false);
        } else {
          onPaymentFailed();
        }
        return;
      }

      // 2) Load the Razorpay Checkout widget.
      const ok = await loadRazorpay();
      if (!ok) {
        onPaymentFailed();
        return;
      }

      // 3) Open Checkout; on success, verify on the server (which creates the order).
      const rzp = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: "QuickCart",
        description: "Order payment",
        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
        },
        theme: { color: "#ea580c" },
        handler: async (response) => {
          try {
            // Fetch a FRESH token here: Clerk session tokens expire (~60s), and the
            // user may have spent longer than that in the Razorpay popup, so the token
            // captured before checkout opened is likely stale → verify would 401.
            const freshToken = await getToken();
            const { data: verifyData } = await axios.post(
              "/api/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${freshToken}` } }
            );
            if (verifyData.success) onPaymentSuccess(verifyData.orderId);
            else onPaymentFailed();
          } catch (e) {
            onPaymentFailed();
          }
        },
        // User closed the Razorpay popup without paying — a cancellation, not a
        // failure, so just drop the loader (no error screen).
        modal: { ondismiss: () => setIsPlacingOrder(false) },
      });
      rzp.on("payment.failed", () => {
        onPaymentFailed();
      });
      rzp.open();
    } catch (error) {
      onPaymentFailed();
    }
  };

  const handlePlaceOrder = () => {
    if (isPlacingOrder) return;
    if (paymentMethod === "Online") payOnline();
    else createOrder();
  };
  
  return (
    <>
    {isPlacingOrder && <FullScreenLoader message="Placing Order..." />}
    {paymentError && <PaymentErrorScreen onRetry={() => setPaymentError(false)} />}
      <div className="w-full md:w-96 bg-gray-500/5 p-5 relative">
        <h2 className="text-xl md:text-2xl font-medium text-gray-700">Order Summary</h2>
        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-6">
          <div>
            <label className="text-base font-medium uppercase text-gray-600 block mb-2">
              Select Address
            </label>
            <div className="relative inline-block w-full text-sm border">
              <button
                className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>
                  {selectedAddress
                    ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                    : "Select Address"}
                </span>
                <svg
                  className={`w-5 h-5 inline float-right transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-0" : "-rotate-90"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#6B7280"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                  {userAddresses.map((address, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                      onClick={() => handleAddressSelect(address)}
                    >
                      {address.fullName}, {address.area}, {address.city}, {address.state}
                    </li>
                  ))}
                  <li
                    onClick={() => router.push("/add-address")}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                  >
                    + Add New Address
                  </li>
                </ul>
              )}
            </div>
          </div>

          <hr className="border-gray-500/30 my-5" />

          <div className="space-y-4">
            <div className="flex justify-between text-base font-medium">
              <p className="uppercase text-gray-600">Items {getCartCount}</p>
              <p className="text-gray-800">
                {currency}
                {getCartAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600">Shipping Fee</p>
              <p className="font-medium text-gray-800">Free</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600">Tax ({Math.round(TAX_RATE * 100)}%)</p>
              <p className="font-medium text-gray-800">
                {currency}
                {(getCartAmount * TAX_RATE).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
              <p>Total</p>
              <p>
                {currency}
                {(getCartAmount + getCartAmount * TAX_RATE).toFixed(2)}
              </p>
            </div>
          </div>

          <div>
            <label className="text-base font-medium uppercase text-gray-600 block mb-2">Payment Method</label>
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                Cash on Delivery
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment" value="Online" checked={paymentMethod === "Online"} onChange={() => setPaymentMethod("Online")} />
                Pay Online (Razorpay)
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={!user || isPlacingOrder}
          className={`w-full py-3 mt-5 text-white ${
            !user || isPlacingOrder ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {isPlacingOrder ? "Processing..." : paymentMethod === "Online" ? "Pay Now" : "Place Order"}
        </button>
      </div>
    </>
  );
};

export default OrderSummary;

