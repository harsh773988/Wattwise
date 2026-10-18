"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { toast } from "sonner";

const initialState = {
  name: "",
  email: "",
  message: "",
  company: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message || "Unable to send your message.");
      }

      toast.success("Thanks — your message has been received.");
      setForm(initialState);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="neo-card bg-white p-6 sm:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-black uppercase tracking-wide text-black/70">
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-2 w-full border-2 border-black bg-[#fbfbf8] px-3 py-2 text-base font-medium text-black outline-none"
          />
        </label>

        <label className="block text-sm font-black uppercase tracking-wide text-black/70">
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-2 w-full border-2 border-black bg-[#fbfbf8] px-3 py-2 text-base font-medium text-black outline-none"
          />
        </label>
      </div>

      <div className="sr-only" aria-hidden="true">
        <label>
          Leave this empty
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="mt-5 block text-sm font-black uppercase tracking-wide text-black/70">
        Company (optional)
        <input
          type="text"
          name="company"
          value={form.company}
          onChange={handleChange}
          className="mt-2 w-full border-2 border-black bg-[#fbfbf8] px-3 py-2 text-base font-medium text-black outline-none"
        />
      </label>

      <label className="mt-5 block text-sm font-black uppercase tracking-wide text-black/70">
        Message
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={6}
          className="mt-2 w-full border-2 border-black bg-[#fbfbf8] px-3 py-2 text-base font-medium text-black outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="neo-btn mt-6 bg-[#ffe17c] px-5 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
