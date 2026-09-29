"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { connectApi, ConnectContact } from "@/lib/connect-api";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Filter,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Tag,
  CheckCircle2,
  Calendar,
  Sparkles,
  Loader2,
  Trash2,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ConnectContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ConnectContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals & Drawer State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ConnectContact | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Create Contact Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTags, setFormTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchContacts = async () => {
    try {
      setRefreshing(true);
      const res = await connectApi.getContacts({
        page,
        limit: 20,
        search: searchQuery.trim() || undefined,
        tag: selectedTag === "all" ? undefined : selectedTag,
      });

      const list = res.data || [];
      setContacts(list);
      setTotal(res.meta?.total || res.total || list.length);
    } catch (err: any) {
      console.error("Failed to load contacts:", err);
      toast.error(err.message || "Failed to load audience contacts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, selectedTag]);

  // Handle Search on Enter or debounced
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContacts();
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName && !formPhone) {
      toast.error("Please provide at least a name or phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await connectApi.createContact({
        displayName: formName,
        name: formName,
        phone: formPhone,
        email: formEmail,
        tags: tagsArray,
        source: "MANUAL",
      });

      toast.success(`Contact ${formName || formPhone} created successfully`);
      setShowCreateModal(false);
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormTags("");
      await fetchContacts();
    } catch (err: any) {
      console.error("Create contact error:", err);
      toast.error(err.message || "Failed to create contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name || "this contact"}?`)) {
      return;
    }

    try {
      await connectApi.deleteContact(id);
      toast.success("Contact removed");
      if (selectedContact?.id === id || selectedContact?._id === id) {
        setSelectedContact(null);
      }
      await fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact");
    }
  };

  const handleAddNote = async () => {
    if (!selectedContact || !newNote.trim()) return;
    const contactId = selectedContact.id || selectedContact._id;
    if (!contactId) return;

    setAddingNote(true);
    try {
      await connectApi.addContactNote(contactId, newNote.trim());
      toast.success("Note added");
      setNewNote("");
      // Refresh contact detail
      const refreshed = await connectApi.getContactById(contactId);
      setSelectedContact(refreshed);
    } catch (err: any) {
      toast.error(err.message || "Could not add note");
    } finally {
      setAddingNote(false);
    }
  };

  // Distinct tags collected from contacts
  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Audience & Contacts CRM
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Synced with POS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Centralized customer registry with WhatsApp reachability, tag segments, and POS purchase history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContacts}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Contact
          </Button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name, phone (+880...), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </form>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            onClick={() => {
              setSelectedTag("all");
              setPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTag === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            All Contacts ({total})
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedTag(t);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === t
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <span className="text-xs font-medium">Loading audience directory...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No contacts found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              No matching records for your filter. Add a new contact or sync POS sales.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {contacts.map((contact) => {
                  const contactId = contact.id || contact._id || "";
                  const name =
                    contact.displayName ||
                    contact.name ||
                    `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
                    "Customer";
                  const phone = contact.phone || "—";
                  const email = contact.email || "—";
                  const tags = contact.tags || [];

                  return (
                    <tr
                      key={contactId}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {email}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {tags.length === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              >
                                #{t}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {contact.source || "POS"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/connect/inbox?phone=${encodeURIComponent(phone)}`)}
                            className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-500 gap-1"
                            title="Open in Shared Inbox"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(contactId, name)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONTACT DETAIL DRAWER */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedContact(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 font-bold text-base flex items-center justify-center">
                    {(selectedContact.displayName || selectedContact.name || "C").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      {selectedContact.displayName || selectedContact.name || "Customer"}
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedContact.phone || "No phone"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action: Open Chat */}
              <div className="py-4">
                <Button
                  onClick={() =>
                    router.push(
                      `/connect/inbox?phone=${encodeURIComponent(selectedContact.phone || "")}`
                    )
                  }
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-bold py-2 rounded-xl"
                >
                  <MessageSquare className="w-4 h-4" />
                  Start WhatsApp Conversation
                </Button>
              </div>

              {/* Identity & Channels */}
              <div className="space-y-3 py-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Contact Channels
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {selectedContact.phone || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-500">Email</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedContact.email || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="py-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Segment Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContact.tags && selectedContact.tags.length > 0 ? (
                    selectedContact.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No tags assigned</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="py-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  CRM Notes
                </span>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add a customer note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="text-xs h-8"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                      className="text-xs h-8 bg-slate-800 text-white"
                    >
                      {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDeleteContact(
                    selectedContact.id || selectedContact._id || "",
                    selectedContact.displayName || ""
                  )
                }
                className="w-full text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900"
              >
                Delete Contact
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CONTACT MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>Create New Audience Contact</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add a customer to your centralized audience directory for WhatsApp broadcasts and inbox messaging.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateContact} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label htmlFor="contact-name" className="text-xs font-semibold">
                Customer Name
              </Label>
              <Input
                id="contact-name"
                type="text"
                placeholder="e.g. Tanvir Ahmed"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact-phone" className="text-xs font-semibold">
                Phone Number (WhatsApp)
              </Label>
              <Input
                id="contact-phone"
                type="text"
                placeholder="+88017XXXXXXXX"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact-email" className="text-xs font-semibold">
                Email Address (Optional)
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="customer@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact-tags" className="text-xs font-semibold">
                Tags (Comma separated)
              </Label>
              <Input
                id="contact-tags"
                type="text"
                placeholder="VIP, Retail, Dhanmondi Branch"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Save Contact
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
