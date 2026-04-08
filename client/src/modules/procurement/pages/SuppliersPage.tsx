/**
 * File intent: render the Supplier list page for the Procurement module.
 * Design reminder for this file: simple structure only, with data flow prepared for future API integration.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supplierRepository } from "@/modules/procurement/suppliers.repository";
import type { Supplier } from "@/modules/procurement/suppliers.types";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliers() {
      try {
        const data = await supplierRepository.list();

        if (isMounted) {
          setSuppliers(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load suppliers.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSuppliers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section>
      <header>
        <p>Procurement</p>
        <h1>Suppliers</h1>
        <p>Supplier master records based on the approved MVP single-table model.</p>
        <p>
          <Link href="/procurement/suppliers/new">Create supplier</Link>
        </p>
      </header>

      {isLoading ? <p>Loading suppliers...</p> : null}
      {error ? <p>{error}</p> : null}

      {!isLoading && !error ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Ordering method</th>
              <th>Invoice parsing</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.code || "—"}</td>
                <td>{supplier.status}</td>
                <td>{supplier.ordering_method || "—"}</td>
                <td>{supplier.is_enabled_for_invoice_parsing ? "Enabled" : "Disabled"}</td>
                <td>
                  <Link href={`/procurement/suppliers/${supplier.id}`}>View</Link>{" "}
                  <Link href={`/procurement/suppliers/${supplier.id}/edit`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
