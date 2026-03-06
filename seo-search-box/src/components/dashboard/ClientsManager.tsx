"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
  Mail,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  gsc_site_url: string | null;
  ga4_property_id: string | null;
  notes: string | null;
  status: "active" | "paused" | "churned";
  created_at: string;
}

export function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setClients(clients.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting client:", err);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.gsc_site_url?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    active: "bg-green-500/20 text-green-400",
    paused: "bg-yellow-500/20 text-yellow-400",
    churned: "bg-red-500/20 text-red-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-pink animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide">
            Clients
          </h1>
          <p className="text-sm text-[#F5F5F5]/40 mt-1">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink hover:bg-pink/80 text-white font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/40" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] placeholder-[#F5F5F5]/30 focus:outline-none focus:border-pink/50"
        />
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-12 text-center">
          <Building2 className="h-12 w-12 text-[#F5F5F5]/20 mx-auto mb-4" />
          <p className="text-[#F5F5F5]/40">
            {search ? "No clients match your search" : "No clients yet. Add your first client!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl bg-[#000022] border-2 border-pink/30 p-4 hover:border-pink/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#F5F5F5]">
                      {client.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[client.status]
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-[#F5F5F5]/60">
                    {client.contact_email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {client.contact_email}
                      </div>
                    )}
                    {client.gsc_site_url && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        {client.gsc_site_url.replace("sc-domain:", "")}
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <p className="mt-2 text-sm text-[#F5F5F5]/40 line-clamp-1">
                      {client.notes}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
                    className="p-2 rounded-lg hover:bg-[#F5F5F5]/5 text-[#F5F5F5]/40 hover:text-[#F5F5F5]"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {menuOpen === client.id && (
                    <div className="absolute right-0 top-10 w-40 rounded-lg bg-[#1a1a2e] border border-[#F5F5F5]/10 shadow-xl z-10">
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setShowForm(true);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      {client.gsc_site_url && (
                        <a
                          href={`/dashboard/clients/${client.id}`}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Report
                        </a>
                      )}
                      <button
                        onClick={() => {
                          handleDelete(client.id);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Form Modal */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingClient(null);
            fetchClients();
          }}
        />
      )}
    </div>
  );
}

function ClientForm({
  client,
  onClose,
  onSave,
}: {
  client: Client | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(client?.name || "");
  const [email, setEmail] = useState(client?.contact_email || "");
  const [gscUrl, setGscUrl] = useState(client?.gsc_site_url || "");
  const [ga4Id, setGa4Id] = useState(client?.ga4_property_id || "");
  const [notes, setNotes] = useState(client?.notes || "");
  const [status, setStatus] = useState(client?.status || "active");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact_email: email || null,
          gsc_site_url: gscUrl || null,
          ga4_property_id: ga4Id || null,
          notes: notes || null,
          status,
        }),
      });

      onSave();
    } catch (err) {
      console.error("Error saving client:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-[#0a0a1a] border-2 border-pink/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading text-[#F5F5F5]">
            {client ? "Edit Client" : "Add Client"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F5F5F5]/5 text-[#F5F5F5]/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#F5F5F5]/60 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm text-[#F5F5F5]/60 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50"
              placeholder="contact@acme.com"
            />
          </div>

          <div>
            <label className="block text-sm text-[#F5F5F5]/60 mb-1">
              GSC Site URL
            </label>
            <input
              type="text"
              value={gscUrl}
              onChange={(e) => setGscUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50"
              placeholder="sc-domain:acme.com or https://acme.com/"
            />
            <p className="text-xs text-[#F5F5F5]/30 mt-1">
              The property URL from Google Search Console
            </p>
          </div>

          <div>
            <label className="block text-sm text-[#F5F5F5]/60 mb-1">
              GA4 Property ID
            </label>
            <input
              type="text"
              value={ga4Id}
              onChange={(e) => setGa4Id(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50"
              placeholder="123456789"
            />
          </div>

          <div>
            <label className="block text-sm text-[#F5F5F5]/60 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Client["status"])}
              className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#F5F5F5]/60 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50 resize-none"
              placeholder="Any notes about this client..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name}
              className="flex-1 px-4 py-2 rounded-lg bg-pink hover:bg-pink/80 text-white font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : client ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
