'use client';
import { useEffect, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { assets } from "@/assets/assets";
import FullScreenLoader from "@/components/FullScreenLoader";

const DELIVERY_STATUSES = ["Shipped", "Out for Delivery", "Delivered"];

const DeliveryPortal = () => {
  const { getToken } = useAuth();
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/delivery/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (data.success) setOrders(data.orders);
        else toast.error(data.message || "Failed to load deliveries");
      } catch (e) {
        if (!cancelled) toast.error(e.response?.data?.message || "Failed to load deliveries");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        "/api/delivery/update-status",
        { orderId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: data.status } : o)));
        toast.success(`Marked "${data.status}"`);
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <h1 className="text-lg font-semibold text-orange-600">QuickCart Delivery</h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <h2 className="text-lg font-medium mb-4">My Deliveries</h2>

        {loading ? (
          <FullScreenLoader message="Loading deliveries..." />
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No deliveries assigned to you.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 min-w-0">
                    <Image
                      src={order.items[0]?.product?.image?.[0] || assets.box_icon}
                      alt="item"
                      width={56}
                      height={56}
                      className="w-14 h-14 object-contain rounded-md bg-gray-100 p-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-2">
                        {order.items.map((it) => `${it.product?.name || "Item"} x ${it.quantity}`).join(", ")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currency}{order.amount} · {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-orange-600 shrink-0">{order.status}</span>
                </div>

                {order.address && (
                  <div className="text-sm text-gray-600 border-t pt-2">
                    <p className="font-medium text-gray-800">{order.address.fullName}</p>
                    <p>{order.address.area}, {order.address.city}, {order.address.state} {order.address.pincode}</p>
                    <a href={`tel:${order.address.phoneNumber}`} className="text-blue-600 hover:underline">
                      {order.address.phoneNumber}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Update status:</span>
                  <select
                    value={DELIVERY_STATUSES.includes(order.status) ? order.status : ""}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    disabled={updatingId === order._id}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50"
                  >
                    <option value="" disabled>Set status…</option>
                    {DELIVERY_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPortal;
