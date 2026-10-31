"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const invalidateCategories = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["admin-categories"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      }),
    ]);
  };

  const getErrorMessage = (error: ApiError, fallback: string) => {
    return error.response?.data?.message || error.message || fallback;
  };

  const { data, isLoading, isError, error, refetch } = useQuery<{
    success: boolean;
    categories: CategoryItem[];
  }>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await api.get("/categories?all=true");
      return res.data;
    },
    enabled: Boolean(user && user.role === "admin"),
  });

  const categories = data?.categories ?? [];

  const saveCategoryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
      };

      if (editingId) {
        return api.patch(`/categories/${editingId}`, payload);
      }

      return api.post("/categories", payload);
    },
    onSuccess: async () => {
      await invalidateCategories();
      closeModal();
    },
    onError: (error: ApiError) => {
      setFormError(getErrorMessage(error, "Failed to save category."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/categories/${id}`);
    },
    onSuccess: async () => {
      setDeleteError(null);
      await invalidateCategories();
    },
    onError: (error: ApiError) => {
      setDeleteError(getErrorMessage(error, "Unable to delete this category."));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/categories/${id}`, {
        isActive,
      });
    },
    onSuccess: async () => {
      await invalidateCategories();
    },
    onError: (error: ApiError) => {
      setDeleteError(
        getErrorMessage(error, "Unable to update category status."),
      );
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setImage("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryItem) => {
    setEditingId(category._id);
    setName(category.name);
    setDescription(category.description || "");
    setImage(category.image || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setImage("");
    setFormError(null);
  };

  const handleDelete = (category: CategoryItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${category.name}"?`,
    );

    if (!confirmed) return;

    setDeleteError(null);
    deleteMutation.mutate(category._id);
  };

  const handleToggleStatus = (category: CategoryItem) => {
    setDeleteError(null);

    toggleMutation.mutate({
      id: category._id,
      isActive: !category.isActive,
    });
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Category Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create, edit, and organize product collections safely.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-600 dark:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add New Category
        </button>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-slate-900">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            {getErrorMessage(error as ApiError, "Failed to load categories.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white"
          >
            Try Again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Layers className="mx-auto mb-2 h-10 w-10 text-slate-300" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No categories configured yet.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 text-xs font-bold text-brand-blue hover:underline dark:text-cyan-400"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categories.map((category) => {
                  const isToggling =
                    toggleMutation.isPending &&
                    toggleMutation.variables?.id === category._id;

                  const isDeleting =
                    deleteMutation.isPending &&
                    deleteMutation.variables === category._id;

                  return (
                    <tr
                      key={category._id}
                      className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 shrink-0 text-brand-blue dark:text-cyan-400" />
                          <span>{category.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-500">
                        {category.slug}
                      </td>

                      <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                        {category.description || "No description"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            category.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                        >
                          {category.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>

                      <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(category)}
                          disabled={
                            toggleMutation.isPending || deleteMutation.isPending
                          }
                          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300"
                        >
                          {isToggling ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : category.isActive ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          {category.isActive ? "Hide" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          disabled={
                            deleteMutation.isPending || toggleMutation.isPending
                          }
                          className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline disabled:opacity-50 dark:text-cyan-400"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={
                            deleteMutation.isPending || toggleMutation.isPending
                          }
                          className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close category modal"
            className="fixed inset-0 cursor-default bg-slate-900/60 backdrop-blur-xs"
            onClick={closeModal}
          />

          <div className="relative z-10 w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit Category" : "Create New Category"}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setFormError(null);
                saveCategoryMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Category Name *
                </label>

                <input
                  id="category-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Mechanical Keyboards"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Brief overview of collection..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="category-image"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Image URL (Optional)
                </label>

                <input
                  id="category-image"
                  type="url"
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  placeholder="https://example.com/category.jpg"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saveCategoryMutation.isPending}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saveCategoryMutation.isPending || name.trim().length < 2
                  }
                  className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600"
                >
                  {saveCategoryMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}

                  {editingId ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
