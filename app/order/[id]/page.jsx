'use client';
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FullScreenLoader from "@/components/FullScreenLoader";
import { assets } from "@/assets/assets";
import { TAX_RATE } from "@/lib/pricing";

// Fulfillment stages in order — drives the timeline.
const STAGES = ["Order Placed", "Shipped", "Out for Delivery", "Delivered"];
// Final states — once an order reaches one of these, there's nothing left to update,
// so we stop the live polling.
const TERMINAL_STATUSES = new Set(["Delivered", "Cancelled"]);
// How often to re-check the status while the order is still in progress.
const POLL_INTERVAL_MS = 7000;

const OrderDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);   // is the page auto-refreshing the status?
  const lastStatusRef = useRef(null);         // remember the last status to detect changes

  // Fetch the order. `silent` = a background refresh: no full-screen loader, and it
  // toasts when the status actually changed (so the user notices the live update).
  const fetchOrder = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`/api/order/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!data.success) {
          if (!silent) setError(data.message || "Could not load order");
          return null;
        }
        if (silent && lastStatusRef.current && data.order.status !== lastStatusRef.current) {
          toast.success(`Order update: ${data.order.status}`);
        }
        lastStatusRef.current = data.order.status;
        setOrder(data.order);
        return data.order.status;
      } catch (e) {
        if (!silent) setError(e.response?.data?.message || "Could not load this order");
        return null;
      }
    },
    [id, getToken]
  );

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchOrder();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchOrder]);

  // Live updates: while the order isn't in a final state, re-check the status every few
  // seconds. We PAUSE when the tab is hidden and STOP once it's Delivered/Cancelled, so
  // we never poll needlessly. (Polling fits here — Vercel serverless can't hold open
  // WebSocket/SSE connections, and status changes are infrequent.)
  useEffect(() => {
    const status = order?.status;
    if (!status || TERMINAL_STATUSES.has(status)) {
      setLive(false);
      return;
    }
    setLive(true);
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return; // pause in background tabs
      fetchOrder({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [order?.status, fetchOrder]);

  if (loading) return <FullScreenLoader message="Loading order..." />;

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-lg text-gray-600">{error || "Order not found"}</p>
          <button
            onClick={() => router.push("/my-orders")}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Back to My Orders
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const isCancelled = order.status === "Cancelled";
  const currentStageIndex = STAGES.indexOf(order.status); // -1 for cancelled/unknown
  const total = Number(order.amount) || 0;
  const subtotal = total / (1 + TAX_RATE);
  const tax = total - subtotal;
  const orderDate = new Date(order.date);

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-8 py-8">
        <button onClick={() => router.push("/my-orders")} className="text-sm text-orange-600 hover:underline mb-5">
          &larr; My Orders
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* LEFT: items + status timeline */}
          <div className="flex-1 space-y-6">
            {/* Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Image
                    src={item.product?.image?.[0] || assets.box_icon}
                    alt={item.product?.name || "item"}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain rounded-md bg-gray-100 p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 line-clamp-2">
                      {item.product?.name || "Product unavailable"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                      {item.product?.offerPrice != null && ` · ${currency}${item.product.offerPrice}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Order Status</h3>
                {live && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    Live
                  </span>
                )}
              </div>
              {isCancelled ? (
                <div className="flex items-center gap-3 text-red-600">
                  <span className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="font-medium">Order Cancelled</span>
                </div>
              ) : (
                <ol>
                  {STAGES.map((stage, i) => {
                    const done = i <= currentStageIndex;
                    const last = i === STAGES.length - 1;
                    return (
                      <li key={stage} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className={`w-4 h-4 rounded-full shrink-0 ${done ? "bg-green-500" : "bg-gray-300"}`} />
                          {!last && (
                            <span className={`w-0.5 flex-1 min-h-[2.5rem] ${i < currentStageIndex ? "bg-green-500" : "bg-gray-200"}`} />
                          )}
                        </div>
                        <div className={last ? "" : "pb-2"}>
                          <p className={`font-medium ${done ? "text-gray-800" : "text-gray-400"}`}>{stage}</p>
                          {i === 0 && <p className="text-xs text-gray-500">{orderDate.toLocaleString()}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          {/* RIGHT: delivery + price */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Delivery details</h3>
              {order.address ? (
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-800">{order.address.fullName}</p>
                  <p>{order.address.area}</p>
                  <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                  <p>{order.address.phoneNumber}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Address unavailable</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Price details</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between"><span>Items total</span><span>{currency}{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax ({Math.round(TAX_RATE * 100)}%)</span><span>{currency}{tax.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">Free</span></div>
                <div className="flex justify-between font-semibold text-gray-800 border-t pt-2"><span>Total</span><span>{currency}{total.toFixed(2)}</span></div>
                <div className="flex justify-between pt-1 text-gray-500"><span>Payment</span><span>{order.paymentMethod || "COD"} · {order.paymentStatus || "Pending"}</span></div>
              </div>
            </div>

            <div className="text-xs text-gray-400 break-all">
              <p>Order ID: {order._id}</p>
              <p>Placed: {orderDate.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderDetail;
