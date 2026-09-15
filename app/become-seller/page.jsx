"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import FullScreenLoader from "@/components/FullScreenLoader";

// Defined at MODULE scope (NOT inside BecomeSeller) so its identity is stable across
// renders. If it were defined inside the component, every keystroke would create a new
// Shell type → React remounts the subtree → inputs lose focus after each character.
const Shell = ({ children }) => (
  <>
    <Navbar />
    <div className="min-h-[70vh] px-6 md:px-16 lg:px-32 py-12 flex justify-center">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  </>
);

const BecomeSeller = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [application, setApplication] = useState(null); // { status, storeName, rejectionReason }
  const [form, setForm] = useState({ storeName: "", phone: "", description: "" });

  const loadStatus = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/seller/application", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setIsSeller(data.isSeller);
        setApplication(data.application);
      }
    } catch (e) {
      console.error("Failed to load seller application status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.storeName.trim() || !form.phone.trim()) {
      toast.error("Store name and phone are required");
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await axios.post("/api/seller/apply", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("Application submitted!");
        await loadStatus(); // pull the canonical application shape from the server
      } else {
        toast.error(data.message || "Could not submit application");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullScreenLoader message="Loading..." />;

  // Not signed in
  if (!isSignedIn) {
    return (
      <Shell>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">Become a Seller</h1>
          <p className="text-gray-600 mb-6">Please sign in to apply to sell on QuickCart.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Go Home
          </button>
        </div>
      </Shell>
    );
  }

  // Already a seller
  if (isSeller) {
    return (
      <Shell>
        <div className="text-center bg-green-50 border border-green-200 rounded-lg p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">You're already a seller 🎉</h1>
          <p className="text-gray-600 mb-6">Head to your dashboard to manage products and orders.</p>
          <button
            onClick={() => router.push("/seller")}
            className="px-6 py-2.5 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Go to Seller Dashboard
          </button>
        </div>
      </Shell>
    );
  }

  // Pending application
  if (application?.status === "pending") {
    return (
      <Shell>
        <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-8">
          <div className="text-4xl mb-3">⏳</div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Application under review</h1>
          <p className="text-gray-600">
            Your request to sell{application.storeName ? ` as "${application.storeName}"` : ""} is
            being reviewed. We'll grant seller access once it's approved.
          </p>
        </div>
      </Shell>
    );
  }

  // No application yet, or previously rejected → show the form
  return (
    <Shell>
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">Become a Seller</h1>
      <p className="text-gray-600 mb-6">
        Tell us about your store. An admin will review your application and grant you seller access.
      </p>

      {application?.status === "rejected" && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
          Your previous application was <strong>rejected</strong>
          {application.rejectionReason ? `: ${application.rejectionReason}` : "."} You can update your
          details and apply again below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store name *</label>
          <input
            type="text"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            placeholder="e.g. Nitin Electronics"
            className="w-full border border-gray-300 rounded px-3 py-2.5 outline-none focus:border-orange-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Contact number"
            className="w-full border border-gray-300 rounded px-3 py-2.5 outline-none focus:border-orange-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What will you sell? (optional)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Tell us about your products..."
            className="w-full border border-gray-300 rounded px-3 py-2.5 outline-none focus:border-orange-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 text-white rounded ${
            submitting ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </Shell>
  );
};

export default BecomeSeller;
