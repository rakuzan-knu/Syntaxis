export type DiffKind = 'hunk' | 'context' | 'add' | 'del';

export interface DiffLine {
  kind: DiffKind;
  text: string;
  oldNumber?: number;
  newNumber?: number;
}

export interface DiffFile {
  path: string;
  lines: readonly DiffLine[];
}

type RawLine = readonly [DiffKind, string];

function number(raw: readonly RawLine[], oldStart: number, newStart: number): DiffLine[] {
  let oldLine = oldStart;
  let newLine = newStart;
  return raw.map(([kind, text]) => {
    if (kind === 'hunk') return { kind, text };
    if (kind === 'add') return { kind, text, newNumber: newLine++ };
    if (kind === 'del') return { kind, text, oldNumber: oldLine++ };
    return { kind, text, oldNumber: oldLine++, newNumber: newLine++ };
  });
}

export const DIFF: readonly DiffFile[] = [
  {
    path: 'src/features/checkout/api/monobank.ts',
    lines: number(
      [
        ['hunk', '@@ -12,7 +12,13 @@ export async function createInvoice(order: Order) {'],
        ['context', '  const amount = toKopecks(order.total);'],
        ['del', "  const response = await fetch(MONO_URL, { method: 'POST', body });"],
        [
          'add',
          "  const response = await monobank.post<Invoice>('/api/merchant/invoice/create', {",
        ],
        ['add', '    amount,'],
        ['add', '    ccy: UAH,'],
        ['add', '    merchantPaymInfo: { reference: order.id },'],
        ['add', '    webHookUrl: `${env.API_URL}/v1/webhooks/monobank`,'],
        ['add', '  }, { idempotencyKey: order.id });'],
        ['context', '  if (!response.ok) {'],
        ['del', "    throw new Error('Payment failed');"],
        ['add', '    throw new PaymentError(response.status, response.body);'],
        ['context', '  }'],
        ['add', '  await orders.attachInvoice(order.id, response.data.invoiceId);'],
        ['context', '  return response.data.pageUrl;'],
        ['context', '}'],
      ],
      12,
      12,
    ),
  },
  {
    path: 'src/features/checkout/api/monobank.test.ts',
    lines: number(
      [
        ['hunk', '@@ -0,0 +1,6 @@'],
        ['add', "it('creates an invoice once per order', async () => {"],
        ['add', '  await createInvoice(order);'],
        ['add', '  await createInvoice(order);'],
        ['add', '  expect(monobank.post).toHaveBeenCalledTimes(1);'],
        ['add', '});'],
      ],
      0,
      1,
    ),
  },
];

export function diffStats(files: readonly DiffFile[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const file of files) {
    for (const line of file.lines) {
      if (line.kind === 'add') additions += 1;
      if (line.kind === 'del') deletions += 1;
    }
  }
  return { additions, deletions };
}
