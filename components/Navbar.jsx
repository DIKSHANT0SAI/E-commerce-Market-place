"use client"
import React, { useState, useEffect } from "react";
import { assets, BagIcon, BoxIcon, HomeIcon, search_icon } from "@/assets/assets";
import Link from "next/link"
import Image from "next/image";
import { useClerk, UserButton, useUser } from "@clerk/nextjs";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu, X, ShoppingCart } from "lucide-react";
import { selectCartCount } from "@/app/redux/selectors/cartselecters";

import { useFetchUserData } from "@/app/customhooks/useFetchUserdata";
import { useFetchProductData } from "@/app/customhooks/useFetchproductDat";
import { useFetchCartData } from "@/app/customhooks/useFetchCartData";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const dispatch = useDispatch();
  const isSeller = useSelector((state) => state.user.isSeller)
  const cartCount = useSelector(selectCartCount);
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();

  // Admin link visibility is a CLIENT convenience only — the real guard is server-side
  // (authAdmin + middleware via ADMIN_EMAILS). Mirror the same allowlist for the UI here.
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    isSignedIn &&
    adminEmails.includes((user?.primaryEmailAddress?.emailAddress || "").toLowerCase());
  useFetchUserData();
  useFetchProductData();
  useFetchCartData();
  const router = useRouter();

  // State to manage the search bar and nav menu visibility on mobile
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mobile panels are mutually exclusive — opening one closes the other
  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
    setIsMenuOpen(false);
  };
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setIsSearchOpen(false);
  };
  const closeMenu = () => setIsMenuOpen(false);

  // Close mobile panels when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <nav className="flex items-center justify-between px-6 md:px-10 py-3 text-gray-700">
          
          {/* Left Section: Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                className="cursor-pointer w-28"
                src={assets.logo}
                alt="logo"
              />
            </Link>
          </div>

          {/* Middle Section: Desktop Nav Links and Search Bar */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-6">
            <Link href="/" className="hover:text-gray-900 transition flex-shrink-0">Home</Link>
            <Link href="/all-products" className="hover:text-gray-900 transition flex-shrink-0">Shop</Link>
            <Link href="/become-seller" className="hover:text-gray-900 transition flex-shrink-0">Sell</Link>
            <div className="w-full max-w-[180px] lg:max-w-[260px]">
                <SearchBar />
            </div>
          </div>

          {/* Right Section: Search Icon (Mobile) + User Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleSearch}
              aria-label="Toggle search"
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition"
            >
              <Image src={assets.search_icon} alt="Search" width={22} height={22} />
            </button>
            <button
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {/* Cart with live item-count badge (Flipkart-style, always visible) */}
            <Link
              href="/cart"
              aria-label={cartCount > 0 ? `Cart, ${cartCount} item${cartCount > 1 ? "s" : ""}` : "Cart"}
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold leading-none text-white bg-orange-600 rounded-full">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  {isSeller && <UserButton.Action label="Seller Dashboard" labelIcon={<BoxIcon />} onClick={() => router.push('/seller')} />}
                  {!isSeller && <UserButton.Action label="Become a Seller" labelIcon={<BoxIcon />} onClick={() => router.push('/become-seller')} />}
                  {isAdmin && <UserButton.Action label="Admin" labelIcon={<BoxIcon />} onClick={() => router.push('/admin/seller-applications')} />}
                  {user?.publicMetadata?.role === 'delivery' && <UserButton.Action label="Delivery" labelIcon={<BoxIcon />} onClick={() => router.push('/delivery')} />}
                  <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')} />
                </UserButton.MenuItems>
              </UserButton>
            ) : (
              <button onClick={() => openSignIn()} className="flex items-center gap-2 hover:text-gray-900 transition px-3 py-1.5 rounded-full border border-gray-200 bg-white">
                <Image src={assets.user_icon} alt="user icon" />
                Account
              </button>
            )}
          </div>
        </nav>

        {/* Collapsible Search Bar for Mobile */}
        {isSearchOpen && (
          <div className="md:hidden px-6 pb-4 animate-slide-down">
            <SearchBar />
          </div>
        )}

        {/* Collapsible Nav Menu for Mobile */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 px-6 py-2 flex flex-col animate-slide-down">
            <Link href="/" onClick={closeMenu} className="py-3 hover:text-gray-900 transition border-b border-gray-100">Home</Link>
            <Link href="/all-products" onClick={closeMenu} className="py-3 hover:text-gray-900 transition border-b border-gray-100">Shop</Link>
            <Link href="/become-seller" onClick={closeMenu} className="py-3 hover:text-gray-900 transition border-b border-gray-100">Sell</Link>
            <Link href="/my-orders" onClick={closeMenu} className="py-3 hover:text-gray-900 transition">My Orders</Link>
          </div>
        )}
      </header>
    </>
  );
};

export default dynamic(() => Promise.resolve(Navbar), { ssr: false })