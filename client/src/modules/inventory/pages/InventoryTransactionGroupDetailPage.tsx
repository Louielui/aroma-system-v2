/**
 * File intent: render a read-only Inventory transaction group detail page for audit review and source-document traceability.
 * Design reminder for this file: keep Inventory transparent and navigable while preserving a strict no-edit, no-posting UI boundary.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { inventoryRepository } from "@/modules/inventory/inventory.repository";
import type {
  InventoryLocation,
  InventoryTransaction,
  InventoryTransactionGroup,
} from "@/modules/inventory/inventory.types";

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export default function InventoryTransactionGroupDetailPage() {
  const [matches, params] = useRoute<{ transactionGroupId: string }>(
    "/inventory/transaction-groups/:transactionGroupId",
  );
  const { filterByAllowedLocations } = useAccessControl();
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [group, setGroup] = useState<InventoryTransactionGroup | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!matches || !params?.transactionGroupId) {
        if (isMounted) {
          setError("Transaction group not found.");
          setIsLoading(false);
        }
        return;
      }

      const [nextLocations, nextGroup, nextTransactions] = await Promise.all([
        inventoryRepository.listLocations(),
        inventoryRepository.getTransactionGroupById(params.transactionGroupId),
        inventoryRepository.listTransactions(),
      ]);

      if (!isMounted) {
        return;
      }

      if (!nextGroup) {
        setError("Transaction group not found.");
        setIsLoading(false);
        return;
      }

      const filteredLocations = filterByAllowedLocations(nextLocations, (location) => location.name);
      const allowedLocationIds = new Set(filteredLocations.map((location) => location.id));
      const groupedTransactions = nextTransactions.filter(
        (transaction) =>
          transaction.transaction_group_id === nextGroup.id && allowedLocationIds.has(transaction.location_id),
      );

      if (groupedTransactions.length === 0) {
        setError("You do not have access to this transaction group.");
        setIsLoading(false);
        return;
      }

      setLocations(filteredLocations);
      setGroup(nextGroup);
      setTransactions(groupedTransactions);
      setIsLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations, matches, params?.transactionGroupId]);

  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);

  const groupedSummary = useMemo(() => {
    return {
      transferOutCount: transactions.filter((transaction) => transaction.transaction_type === "transfer_out").length,
      transferInCount: transactions.filter((transaction) => transaction.transaction_type === "transfer_in").length,
      varianceCount: transactions.filter((transaction) => transaction.transaction_type.includes("variance")).length,
    };
  }, [transactions]);

  if (isLoading) {
    return <p>Loading transaction group...</p>;
  }

  if (error || !group) {
    return (
      <section>
        <p>{error || "Transaction group not found."}</p>
        <p>
          <Link href="/inventory/transactions">Back to Transaction History</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <header>
        <p>Inventory</p>
        <h1>Transaction Group Detail</h1>
        <p>
          Review all ledger rows created under a single posting group. This page is read-only and designed for audit
          review across transfer out, transfer in, and variance consequences.
        </p>
      </header>

      <p>
        <Link href="/inventory/transactions">Back to Transaction History</Link>{" "}
        {group.source_document_type === "internal_transfer" ? (
          <Link href={`/logistics/transfer-orders/${group.source_document_id}`}>View Source Internal Transfer</Link>
        ) : null}
      </p>

      <section>
        <h2>Group Header</h2>
        <table>
          <tbody>
            <tr>
              <th>Group ID</th>
              <td>{group.id}</td>
            </tr>
            <tr>
              <th>Posting Status</th>
              <td>{group.posting_status}</td>
            </tr>
            <tr>
              <th>Source Module</th>
              <td>{group.source_module}</td>
            </tr>
            <tr>
              <th>Source Document Type</th>
              <td>{group.source_document_type}</td>
            </tr>
            <tr>
              <th>Source Document ID</th>
              <td>
                {group.source_document_type === "internal_transfer" ? (
                  <Link href={`/logistics/transfer-orders/${group.source_document_id}`}>{group.source_document_id}</Link>
                ) : (
                  group.source_document_id
                )}
              </td>
            </tr>
            <tr>
              <th>Occurred At</th>
              <td>{group.occurred_at}</td>
            </tr>
            <tr>
              <th>Posted At</th>
              <td>{group.posted_at ?? "-"}</td>
            </tr>
            <tr>
              <th>Notes</th>
              <td>{group.notes || "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Group Summary</h2>
        <table>
          <tbody>
            <tr>
              <th>Transfer Out Rows</th>
              <td>{groupedSummary.transferOutCount}</td>
            </tr>
            <tr>
              <th>Transfer In Rows</th>
              <td>{groupedSummary.transferInCount}</td>
            </tr>
            <tr>
              <th>Variance Rows</th>
              <td>{groupedSummary.varianceCount}</td>
            </tr>
            <tr>
              <th>Total Rows</th>
              <td>{transactions.length}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Ledger Rows in This Group</h2>
        <table>
          <thead>
            <tr>
              <th>Occurred At</th>
              <th>Location</th>
              <th>Item</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Quantity Delta</th>
              <th>Balance After</th>
              <th>Source Line</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.occurred_at}</td>
                <td>{locationMap.get(transaction.location_id) ?? transaction.location_id}</td>
                <td>{transaction.item_name}</td>
                <td>{transaction.transaction_type}</td>
                <td>{transaction.reason_code}</td>
                <td>{formatQuantity(transaction.quantity_delta)}</td>
                <td>{transaction.balance_after == null ? "-" : formatQuantity(transaction.balance_after)}</td>
                <td>{transaction.source_line_id ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
