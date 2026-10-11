import { Table, TableHeader, TableRow } from '@indxsearch/systm';

export type PropRow = { name: string; type: string; default?: string; description: string };

/** A component's props, for the page that documents it. */
export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <Table>
      <TableHeader>
        <th>Prop</th>
        <th>Type</th>
        <th>Default</th>
        <th>What it does</th>
      </TableHeader>
      <tbody>
        {rows.map(r => (
          <TableRow key={r.name}>
            <td><code>{r.name}</code></td>
            <td><code>{r.type}</code></td>
            <td>{r.default ? <code>{r.default}</code> : '–'}</td>
            <td>{r.description}</td>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
