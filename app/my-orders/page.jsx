'use client';
import React, { useEffect, useState, useRef } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setRefreshOrders } from "@/app/redux/slices/userSlice";
import OrderCardSkeleton from '@/components/OrderCardSkeleton';
import { useRouter } from "next/navigation";

// Size each batch to roughly one screenful of order cards instead of a fixed count.
// Card height differs by layout (cards stack taller on mobile), so we estimate per breakpoint.
const MIN_PAGE_SIZE = 3;
const getViewportPageSize = () => {
  if (typeof window === "undefined") return MIN_PAGE_SIZE;
  const isDesktop = window.innerWidth >= 768;
  const cardHeight = isDesktop ? 140 : 300; // approx order-card height per layout
  const listTop = 200; // space above the list (navbar + page heading + padding)
  const available = window.innerHeight - listTop;
  return Math.max(MIN_PAGE_SIZE, Math.ceil(available / cardHeight));
};

const MyOrders = () => {
     const currency = process.env.NEXT_PUBLIC_CURRENCY; 
  const { getToken } = useAuth();
  const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(null); // one screenful, computed on mount
  const [loadingMore, setLoadingMore] = useState(false);
  const { isLoaded } = useUser();
  const user = useSelector((state) => state.user.user);
    const refreshOrders = useSelector((state) => state.user.refreshOrders);
  const dispatch = useDispatch();
    const sentinelRef = useRef();
    const observer = useRef();
    const firstCardRef = useRef(null);
   
  const fetchOrders = async (pageNum = 1, append = false, customPageSize = MIN_PAGE_SIZE) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
  try {
    const token = await getToken();
      const { data } = await axios.get(`/api/order/list?page=${pageNum}&limit=${customPageSize}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data.success) {
        if (append) {
          setOrders((prev) => [...prev, ...data.orders]);
        } else {
          setOrders(data.orders);
        }
        setHasMore(data.hasMore);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
  }
};

// Decide the batch size from the viewport once, on mount.
useEffect(() => {
  setPageSize(getViewportPageSize());
}, []);

useEffect(() => {
  if (pageSize && user && isLoaded) {
      fetchOrders(1, false, pageSize);
      setPage(1);
    if (refreshOrders) {
        dispatch(setRefreshOrders(false));
    }
  }
}, [user, isLoaded, pageSize]);

useEffect(() => {
  if (pageSize && user && isLoaded && refreshOrders) {
      fetchOrders(1, false, pageSize);
      setPage(1);
      dispatch(setRefreshOrders(false));
  }
}, [refreshOrders]);


// Infinite scroll: observe sentinel
useEffect(() => {
  if (loadingMore) return;
  if (!hasMore) return;
  const currentSentinel = sentinelRef.current;
  if (!currentSentinel) return;
  if (observer.current) observer.current.disconnect();
  observer.current = new window.IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore && !loadingMore) {
      setPage(prev => prev + 1);
    }
  });
  observer.current.observe(currentSentinel);
  return () => observer.current && observer.current.disconnect();
}, [loadingMore, hasMore, orders]);

// Fetch next page when page changes (but not on initial mount)
useEffect(() => {
  if (page === 1) return;
  fetchOrders(page, true, pageSize);
}, [page]);

  return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">
                <div className="space-y-5">
                    <h2 className="text-lg font-medium mt-6">My Orders</h2>
          {loading ? (
            <div className="mt-8">
              {Array.from({ length: pageSize || MIN_PAGE_SIZE }).map((_, i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="max-w-5xl border-t border-gray-300 text-sm">
                        {orders.filter(order => order.items && order.items.length > 0).map((order, index) => (
                            <div
                                key={index}
                                ref={index === 0 ? firstCardRef : null}
                                onClick={() => router.push(`/order/${order._id}`)}
                                className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300 cursor-pointer hover:bg-gray-50 transition"
                            >
                                <div className="flex-1 flex gap-5 max-w-80">
                                    <div className="relative shrink-0">
                                        <Image
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-md bg-gray-100 p-1"
                                            src={order.items[0]?.product?.image?.[0] || assets.box_icon}
                                            alt={order.items[0]?.product?.name || "order item"}
                                            width={80}
                                            height={80}
                                        />
                                        {order.items.length > 1 && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-medium rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                                +{order.items.length - 1}
                                            </span>
                                        )}
                                    </div>
                                    <p className="flex flex-col gap-3">
                                        <span className="font-medium text-base line-clamp-2">
                                            {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                        </span>
                                        <span>Items : {order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        <span className="font-medium">{order.address.fullName}</span>
                                        <br />
                                        <span >{order.address.area}</span>
                                        <br />
                                        <span>{`${order.address.city}, ${order.address.state}`}</span>
                                        <br />
                                        <span>{order.address.phoneNumber}</span>
                                    </p>
                                </div>
                                <p className="font-medium my-auto">{currency}{order.amount}</p>
                                <div>
                                    <p className="flex flex-col">
                                        <span className="font-medium text-orange-600">{order.status}</span>
                                        <span>Date : {new Date(order.date).toLocaleDateString()}</span>
                                        <span>{order.paymentMethod || "COD"} · {order.paymentStatus || "Pending"}</span>
                                        <span className="text-xs text-gray-400">Tap to view details &rarr;</span>
                                    </p>
                                </div>
                            </div>
                        ))}
              {/* Show skeletons at the end if loading more */}
              {loadingMore && orders.length > 0 &&
                Array.from({ length: pageSize || MIN_PAGE_SIZE }).map((_, i) => <OrderCardSkeleton key={`loadmore-${i}`} />)
              }
              {/* Sentinel div for infinite scroll */}
              <div ref={sentinelRef} style={{ height: 1 }} />
              {!hasMore && orders.length > 0 && (
                <div className="flex justify-center my-6 text-gray-400">No more orders to load.</div>
              )}
            </div>
          )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;