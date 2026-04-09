/**
 * File intent: provide a read-only Inventory overview page for balances, recent ledger activity, and audit navigation.
 * Design reminder for this file: keep Inventory visible and operationally useful without introducing any edit or posting controls.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { inventoryItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { inventoryRepository } from "@/modules/inventory/inventory.repository";
import type {
  InventoryBalance,
  InventoryLocation,
  InventoryTransaction,
  InventoryTransactionGroup,
} from "@/modules/inventory/inventory.types";

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export default function InventoryOverviewPage() {
  const { filterByAllowedLocations } = useAccessControl();
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionGroups, setTransactionGroups] = useState<InventoryTransactionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [nextLocations, nextBalances, nextTransactions, nextGroups] = await Promise.all([
        inventoryRepository.listLocations(),
        inventoryRepository.listBalances(),
        inventoryRepository.listTransactions(),
        inventoryRepository.listTransactionGroups(),
      ]);

      if (!isMounted) {
        return;
      }

      const filteredLocations = filterByAllowedLocations(nextLocations, (location) => location.name);
      const allowedLocationIds = new Set(filteredLocations.map((location) => location.id));

      setLocations(filteredLocations);
      setBalances(nextBalances.filter((balance) => allowedLocationIds.has(balance.location_id)));
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

  const groupedBalances = useMemo(() => {
    return balances
      .slice()
      .sort((left, right) => {
        const leftLocation = locationMap.get(left.location_id) ?? left.location_id;
        const rightLocation = locationMap.get(right.location_id) ?? right.location_id;
        const locationCompare = leftLocation.localeCompare(rightLocation);
        return locationCompare !== 0 ? locationCompare : left.item_name.localeCompare(right.item_name);
      });
  }, [balances, locationMap]);

  const recentTransactions = useMemo(() => transactions.slice(0, 8), [transactions]);
  const recentGroups = useMemo(() => {
    return transactionGroups
      .filter((group) => group.source_module !== "inventory" || group.source_document_type !== "opening_balance")
      .slice(0, 8);
  }, [transactionGroups]);

  return (
    <section>
      <header>
        <p>Inventory</p>
        <h1>Inventory Overview</h1>
        <p>
          View current on-hand quantities by item and location, inspect recent ledger activity, and drill into posting
          groups without exposing any edit or posting controls.
        </p>
      </header>

      <nav aria-label="Inventory module links">
        <p>Module routes</p>
        <ul>
          {inventoryItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>{item.title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <p>
        <Link href="/inventory/transactions">Open full transaction history</Link>
      </p>

      {isLoading ? (
        <p>Loading inventory visibility data...</p>
      ) : (
        <>
          <section>
            <h2>Inventory Balances by Item and Location</h2>
            {groupedBalances.length === 0 ? (
              <p>No inventory balances are available for your allowed locations.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Item</th>
                    <th>Base Unit</th>
                    <th>On Hand Quantity</th>
                    <th>Last Transaction At</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedBalances.map((balance) => (
                    <tr key={balance.id}>
                      <td>{locationMap.get(balance.location_id) ?? balance.location_id}</td>
                      <td>{balance.item_name}</td>
                      <td>{balance.base_unit}</td>
                      <td>{formatQuantity(balance.on_hand_quantity)}</td>
                      <td>{balance.last_transaction_at ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Recent Transaction Groups</h2>
            {recentGroups.length === 0 ? (
              <p>No posted transaction groups are available yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Occurred At</th>
                    <th>Group ID</th>
                    <th>Source</th>
                    <th>Posting Status</th>
                    <th>Source Transfer</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGroups.map((group) => (
                    <tr key={group.id}>
                      <td>{group.occurred_at}</td>
                      <td>
                        <Link href={`/inventory/transaction-groups/${group.id}`}>{group.id}</Link>
                      </td>
                      <td>
                        {group.source_module} / {group.source_document_type}
                      </td>
                      <td>{group.posting_status}</td>
                      <td>
                        {group.source_document_type === "internal_transfer" ? (
                          <Link href={`/logistics/transfer-orders/${group.source_document_id}`}>
                            {group.source_document_id}
                          </Link>
                        ) : (
                          group.source_document_id
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Recent Ledger Activity</h2>
            {recentTransactions.length === 0 ? (
              <p>No inventory transactions are available yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Occurred At</th>
                    <th>Location</th>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Quantity Delta</th>
                    <th>Balance After</th>
                    <th>Group</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => {
                    const group = transaction.transaction_group_id
                      ? transactionGroupMap.get(transaction.transaction_group_id)
                      : null;

                    return (
                      <tr key={transaction.id}>
                        <td>{transaction.occurred_at}</td>
                        <td>{locationMap.get(transaction.location_id) ?? transaction.location_id}</td>
                        <td>{transaction.item_name}</td>
                        <td>{transaction.transaction_type}</td>
                        <td>{formatQuantity(transaction.quantity_delta)}</td>
                        <td>{transaction.balance_after == null ? "-" : formatQuantity(transaction.balance_after)}</td>
                        <td>
                          {group ? (
                            <Link href={`/inventory/transaction-groups/${group.id}`}>{group.id}</Link>
                          ) : (
                            "-"
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
