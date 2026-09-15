"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import FullScreenLoader from "@/components/FullScreenLoader";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const AdminSellerApplications = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/seller-applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setApplications(data.applications);
      else toast.error(data.message || "Failed to load applications");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const review = async (application, action) => {
    if (actingId) return;
    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Reason for rejection (optional):") ?? "";
    }
    setActingId(application.id);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/admin/seller-applications/review",
        { applicationId: application.id, action, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        await load();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <FullScreenLoader message="Loading applications..." />;

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");

  const Card = ({ a }) => (
    <div className="border border-gray-200 rounded-lg p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-800">{a.storeName}</p>
          <p className="text-sm text-gray-500">
            {a.name || "—"} · {a.email || "—"} · {a.phone}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLES[a.status]}`}>
          {a.status}
        </span>
      </div>
      {a.description && <p className="text-sm text-gray-600 mt-3">{a.description}</p>}
      {a.status === "rejected" && a.rejectionReason && (
        <p className="text-sm text-red-600 mt-2">Reason: {a.rejectionReason}</p>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Applied {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
      </p>
      {a.status === "pending" && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => review(a, "approve")}
            disabled={actingId === a.id}
            className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
          >
            {actingId === a.id ? "..." : "Approve"}
          </button>
          <button
            onClick={() => review(a, "reject")}
            disabled={actingId === a.id}
            className="px-4 py-2 text-sm rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] px-6 md:px-16 lg:px-32 py-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-1">Seller Applications</h1>
        <p className="text-gray-500 mb-8">Review and approve requests to become a seller.</p>

        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Pending <span className="text-gray-400">({pending.length})</span>
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-500">No pending applications.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pending.map((a) => (
                <Card key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        {reviewed.length > 0 && (
          <section>
            <h2 className="text-lg font-medium text-gray-700 mb-4">
              Reviewed <span className="text-gray-400">({reviewed.length})</span>
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {reviewed.map((a) => (
                <Card key={a.id} a={a} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default AdminSellerApplications;
