/**
 * File intent: render a read-only Inventory transaction history page with operational filters and audit drill-down links.
 * Design reminder for this file: keep Inventory visible for audit and operations while preserving read-only behavior and clear links back to source documents.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
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

export default function InventoryTransactionsPage() {
  const { filterByAllowedLocations } = useAccessControl();
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionGroups, setTransactionGroups] = useState<InventoryTransactionGroup[]>([]);
  const [locationFilter, setLocationFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [sourceDocumentFilter, setSourceDocumentFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [nextLocations, nextTransactions, nextGroups] = await Promise.all([
        inventoryRepository.listLocations(),
        inventoryRepository.listTransactions(),
        inventoryRepository.listTransactionGroups(),
      ]);

      if (!isMounted) {
        return;
      }

      const filteredLocations = filterByAllowedLocations(nextLocations, (location) => location.name);
      const allowedLocationIds = new Set(filteredLocations.map((location) => location.id));

      setLocations(filteredLocations);
      setTransactions(nextTransactions.filter((transaction) => allowedLocationIds.has(transaction.location_id)));
      setTransactionGroups(nextGroups);
      setIsLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations]);

  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const transactionGroupMap = useMemo(
    () => new Map(transactionGroups.map((group) => [group.id, group])),
    [transactionGroups],
  );

  const itemOptions = useMemo(
    () => Array.from(new Set(transactions.map((transaction) => transaction.item_name))).sort((a, b) => a.localeCompare(b)),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSourceFilter = sourceDocumentFilter.trim().toLowerCase();

    return transactions.filter((transaction) => {
      if (locationFilter !== "all" && transaction.location_id !== locationFilter) {
        return false;
      }

      if (itemFilter !== "all" && transaction.item_name !== itemFilter) {
        return false;
      }

      if (normalizedSourceFilter && !transaction.source_document_id.toLowerCase().includes(normalizedSourceFilter)) {
        return false;
      }

      return true;
    });
  }, [itemFilter, locationFilter, sourceDocumentFilter, transactions]);

  return (
    <section>
      <header>
        <p>Inventory</p>
        <h1>Transaction History</h1>
        <p>
          Review Inventory ledger movements by location, item, and source document. This page is strictly read-only and
          is intended for operations follow-up and audit traceability.
        </p>
      </header>

      <p>
        <Link href="/inventory/overview">Back to Inventory Overview</Link>
      </p>

      {isLoading ? (
        <p>Loading inventory transactions...</p>
      ) : (
        <>
          <section>
            <h2>Filters</h2>
            <table>
              <tbody>
                <tr>
                  <th>
                    <label htmlFor="inventory-transaction-location-filter">Location</label>
                  </th>
                  <td>
                    <select
                      id="inventory-transaction-location-filter"
                      value={locationFilter}
                      onChange={(event) => setLocationFilter(event.target.value)}
                    >
                      <option value="all">All allowed locations</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th>
                    <label htmlFor="inventory-transaction-item-filter">Item</label>
                  </th>
                  <td>
                    <select
                      id="inventory-transaction-item-filter"
                      value={itemFilter}
                      onChange={(event) => setItemFilter(event.target.value)}
                    >
                      <option value="all">All items</option>
                      {itemOptions.map((itemName) => (
                        <option key={itemName} value={itemName}>
                          {itemName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th>
                    <label htmlFor="inventory-transaction-source-filter">Source document ID</label>
                  </th>
                  <td>
                    <input
                      id="inventory-transaction-source-filter"
                      type="search"
                      value={sourceDocumentFilter}
                      onChange={(event) => setSourceDocumentFilter(event.target.value)}
                      placeholder="Filter by transfer or document ID"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>Ledger Rows</h2>
            <p>{filteredTransactions.length} transaction rows match the current filters.</p>
            {filteredTransactions.length === 0 ? (
              <p>No inventory transactions match the selected filters.</p>
            ) : (
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
                    <th>Transaction Group</th>
                    <th>Source Document</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const group = transaction.transaction_group_id
                      ? transactionGroupMap.get(transaction.transaction_group_id)
                      : null;

                    return (
                      <tr key={transaction.id}>
                        <td>{transaction.occurred_at}</td>
                        <td>{locationMap.get(transaction.location_id) ?? transaction.location_id}</td>
                        <td>{transaction.item_name}</td>
                        <td>{transaction.transaction_type}</td>
                        <td>{transaction.reason_code}</td>
                        <td>{formatQuantity(transaction.quantity_delta)}</td>
                        <td>{transaction.balance_after == null ? "-" : formatQuantity(transaction.balance_after)}</td>
                        <td>
                          {transaction.transaction_group_id ? (
                            <>
                              <Link href={`/inventory/transaction-groups/${transaction.transaction_group_id}`}>
                                {transaction.transaction_group_id}
                              </Link>
                              {group ? ` (${group.posting_status})` : ""}
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          {transaction.source_document_type === "internal_transfer" ? (
                            <Link href={`/logistics/transfer-orders/${transaction.source_document_id}`}>
                              {transaction.source_document_id}
                            </Link>
                          ) : (
                            transaction.source_document_id
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </section>
  );
}
