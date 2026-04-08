/**
 * File intent: provide a read-only Inventory foundation overview page for locations, balances, and ledger transactions.
 * Design reminder for this file: keep Inventory visible but passive, with no write actions and no mutation of Stores or Logistics state.
 */

import { inventoryItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { inventoryRepository } from "@/modules/inventory/inventory.repository";
import type {
  InventoryBalance,
  InventoryLocation,
  InventoryTransaction,
  InventoryTransactionGroup,
} from "@/modules/inventory/inventory.types";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

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

  return (
    <section>
      <header>
        <p>Inventory</p>
        <h1>Inventory Foundation Overview</h1>
        <p>
          This phase exposes passive Inventory structures only. It does not post stock automatically, mutate
          Logistics transfers, or replace Stores demand records.
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

      {isLoading ? (
        <p>Loading inventory foundation data...</p>
      ) : (
        <>
          <section>
            <h2>Inventory Locations</h2>
            {locations.length === 0 ? (
              <p>No inventory locations available for your allowed locations.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Parent</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td>{location.code}</td>
                      <td>{location.name}</td>
                      <td>{location.location_type}</td>
                      <td>{location.parent_location_id ? locationMap.get(location.parent_location_id) ?? location.parent_location_id : "-"}</td>
                      <td>{location.is_active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Inventory Balances</h2>
            {balances.length === 0 ? (
              <p>No inventory balances are available yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Item</th>
                    <th>Base Unit</th>
                    <th>On Hand</th>
                    <th>Last Transaction At</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance) => (
                    <tr key={balance.id}>
                      <td>{locationMap.get(balance.location_id) ?? balance.location_id}</td>
                      <td>{balance.item_name}</td>
                      <td>{balance.base_unit}</td>
                      <td>{balance.on_hand_quantity}</td>
                      <td>{balance.last_transaction_at ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Inventory Ledger</h2>
            {transactions.length === 0 ? (
              <p>No inventory transactions are available yet.</p>
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
                    <th>Source</th>
                    <th>Group Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
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
                        <td>{transaction.quantity_delta}</td>
                        <td>{transaction.balance_after ?? "-"}</td>
                        <td>
                          {transaction.source_module} / {transaction.source_document_type} / {transaction.source_document_id}
                        </td>
                        <td>{group?.posting_status ?? "-"}</td>
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
