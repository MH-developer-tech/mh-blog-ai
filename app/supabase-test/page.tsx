"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupabaseTestPage() {
  const [message, setMessage] = useState("Testing Supabase...");

  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase
          .from("blogs")
          .select("id")
          .limit(1);

        if (error) {
          console.error("Supabase error:", error);
          setMessage(`Supabase connected, but blogs table is not ready: ${error.message}`);
          return;
        }

        setMessage("Supabase connected successfully!");
      } catch (error) {
        console.error("Connection error:", error);
        setMessage("Supabase connection failed.");
      }
    }

    testConnection();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        color: "#111111",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "600px",
        }}
      >
        <h1>MHBlogAI Supabase Test</h1>

        <p>{message}</p>
      </div>
    </main>
  );
}