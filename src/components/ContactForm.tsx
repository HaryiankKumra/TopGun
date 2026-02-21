
"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const { error } = await (supabase as any)
        .from("contact_messages")
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            status: "new",
          },
        ]);

      if (error) {
        console.error(error);
        setStatus("Something went wrong. Please try again.");
      } else {
        setStatus("Message sent successfully!");
        setFormData({ fullName: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      console.error(error);
      setStatus("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur border-sky-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Send us a Message
        </CardTitle>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          Have a question or want to collaborate? We'd love to hear from you!
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sky-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sky-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-sky-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              placeholder="What is this about?"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Message *
            </label>
            <textarea
              rows={5}
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-sky-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
              placeholder="Tell us more about your inquiry, collaboration ideas, or any questions you have..."
            ></textarea>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Send className="w-5 h-5 mr-2" />
            {loading ? "Sending..." : "Send Message"}
          </Button>
          {status && (
            <p className="text-center text-sm text-sky-600 dark:text-sky-400 mt-2">
              {status}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
