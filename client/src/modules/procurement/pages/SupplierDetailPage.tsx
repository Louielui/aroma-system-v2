/**
 * File intent: render the Supplier detail page for the Procurement module.
 * Design reminder for this file: keep presentation simple and focus on approved Supplier model visibility.
 */

import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { supplierRepository } from "@/modules/procurement/suppliers.repository";
import type { Supplier } from "@/modules/procurement/suppliers.types";

export default function SupplierDetailPage() {
  const match = useRoute("/procurement/suppliers/:supplierId");
  const supplierId = match?.[1]?.supplierId ?? "";
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadSupplier() {
      try {
        const data = await supplierRepository.getById(supplierId);

        if (!data) {
          throw new Error("Supplier not found.");
        }

        if (isMounted) {
          setSupplier(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load supplier.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSupplier();

    return () => {
      isMounted = false;
    };
  }, [supplierId]);

  if (isLoading) {
    return <p>Loading supplier...</p>;
  }

  if (error || !supplier) {
    return (
      <section>
        <p>{error || "Supplier not found."}</p>
        <Link href="/procurement/suppliers">Back to supplier list</Link>
      </section>
    );
  }

  return (
    <section>
      <header>
        <p>Procurement</p>
        <h1>{supplier.name}</h1>
        <p>Supplier detail page using the approved MVP Supplier model.</p>
        <p>
          <Link href="/procurement/suppliers">Back to supplier list</Link>{" "}
          <Link href={`/procurement/suppliers/${supplier.id}/edit`}>Edit supplier</Link>
        </p>
      </header>

      <table>
        <tbody>
          <tr><th>ID</th><td>{supplier.id}</td></tr>
          <tr><th>Name</th><td>{supplier.name}</td></tr>
          <tr><th>Short name</th><td>{supplier.short_name || "—"}</td></tr>
          <tr><th>Legal name</th><td>{supplier.legal_name || "—"}</td></tr>
          <tr><th>Code</th><td>{supplier.code || "—"}</td></tr>
          <tr><th>Status</th><td>{supplier.status}</td></tr>
          <tr><th>Contact person</th><td>{supplier.contact_person || "—"}</td></tr>
          <tr><th>Phone</th><td>{supplier.phone || "—"}</td></tr>
          <tr><th>Email</th><td>{supplier.email || "—"}</td></tr>
          <tr><th>Address line 1</th><td>{supplier.address_line_1 || "—"}</td></tr>
          <tr><th>Address line 2</th><td>{supplier.address_line_2 || "—"}</td></tr>
          <tr><th>City</th><td>{supplier.city || "—"}</td></tr>
          <tr><th>Province</th><td>{supplier.province || "—"}</td></tr>
          <tr><th>Postal code</th><td>{supplier.postal_code || "—"}</td></tr>
          <tr><th>Ordering method</th><td>{supplier.ordering_method || "—"}</td></tr>
          <tr><th>Payment terms</th><td>{supplier.payment_terms || "—"}</td></tr>
          <tr><th>Delivery days</th><td>{supplier.delivery_days.join(", ") || "—"}</td></tr>
          <tr><th>Minimum order amount</th><td>{supplier.minimum_order_amount ?? "—"}</td></tr>
          <tr><th>Lead time days</th><td>{supplier.lead_time_days ?? "—"}</td></tr>
          <tr><th>Aliases</th><td>{supplier.aliases.join(", ") || "—"}</td></tr>
          <tr><th>Notes</th><td>{supplier.notes || "—"}</td></tr>
          <tr><th>Invoice parsing</th><td>{supplier.is_enabled_for_invoice_parsing ? "Enabled" : "Disabled"}</td></tr>
          <tr><th>Created at</th><td>{supplier.created_at}</td></tr>
          <tr><th>Updated at</th><td>{supplier.updated_at}</td></tr>
        </tbody>
      </table>
    </section>
  );
}
